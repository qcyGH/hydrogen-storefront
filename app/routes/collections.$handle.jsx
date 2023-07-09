import {useLoaderData} from '@remix-run/react';
import {json} from '@shopify/remix-oxygen';
import {
  AnalyticsPageType,
  flattenConnection,
  Pagination__unstable as Pagination,
  getPaginationVariables__unstable as getPaginationVariables
} from '@shopify/hydrogen';
import ProductCard from '~/components/ProductCard';
import { SortFilter } from '~/components/SortFilter';
import { Grid } from '~/components/Grid';
import { Button } from '~/components/Button';
import { useEffect } from 'react';

const seo = ({data}) => ({
  title: data?.collection?.title,
  description: data?.collection?.description.substr(0, 154),
  media: data?.collection?.image?.url,
});

export const handle = {
  seo,
};

export async function loader({params, context, request}) {
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 24,
  });
  const {handle} = params;

  const searchParams = new URL(request.url).searchParams;

  const knownFilters = ['productVendor', 'productType'];
  const available = 'available';
  const variantOption = 'variantOption';
  const {sortKey, reverse} = getSortValuesFromParam(searchParams.get('sort'));
  const filters = [];
  const appliedFilters = [];

  for (const [key, value] of searchParams.entries()) {
    if (available === key) {
      filters.push({available: value === 'true'});
      appliedFilters.push({
        label: value === 'true' ? 'In stock' : 'Out of stock',
        urlParam: {
          key: available,
          value,
        },
      });
    } else if (knownFilters.includes(key)) {
      filters.push({[key]: value});
      appliedFilters.push({label: value, urlParam: {key, value}});
    } else if (key.includes(variantOption)) {
      const [name, val] = value.split(':');
      filters.push({variantOption: {name, value: val}});
      appliedFilters.push({label: val, urlParam: {key, value}});
    }
  }

  // Builds min and max price filter since we can't stack them separately into
  // the filters array. See price filters limitations:
  // https://shopify.dev/custom-storefronts/products-collections/filter-products#limitations
  if (searchParams.has('minPrice') || searchParams.has('maxPrice')) {
    const price = {};
    if (searchParams.has('minPrice')) {
      price.min = Number(searchParams.get('minPrice')) || 0;
      appliedFilters.push({
        label: `Min: $${price.min}`,
        urlParam: {key: 'minPrice', value: searchParams.get('minPrice')},
      });
    }
    if (searchParams.has('maxPrice')) {
      price.max = Number(searchParams.get('maxPrice')) || 0;
      appliedFilters.push({
        label: `Max: $${price.max}`,
        urlParam: {key: 'maxPrice', value: searchParams.get('maxPrice')},
      });
    }
    filters.push({
      price,
    });
  }

  const {collection, collections} = await context.storefront.query(COLLECTION_QUERY, {
    variables: {
      ...paginationVariables,
      handle: handle,
      filters,
      sortKey,
      reverse,
    },
  });

  // Handle 404s
  if (!collection) {
    throw new Response(null, {status: 404});
  }

  // json is a Remix utility for creating application/json responses
  // https://remix.run/docs/en/v1/utils/json
  return json({
    collection,
    appliedFilters,
    collections: flattenConnection(collections),
    analytics: {
      pageType: AnalyticsPageType.Collection,
      collection: [collection],
    }
  });
}

export default function Collection() {
  const {collection, collections, appliedFilters} = useLoaderData();

  useEffect(() => {
    console.log(collection.products.nodes.length > 1)
  }, [])

  return (
    <>
      <header className="grid w-full gap-8 py-8 justify-items-start">
        <h1 className="text-4xl whitespace-pre-wrap font-bold inline-block">
          {collection.title}
        </h1>

        {collection.description && (
          <div className="flex items-baseline justify-between w-full">
            <div>
              <p className="max-w-md whitespace-pre-wrap inherit text-copy inline-block">
                {collection.description}
              </p>
            </div>
          </div>
        )}
      </header>
      <SortFilter
        filters={collection.products.filters}
        appliedFilters={appliedFilters}
        collections={collections}
      >
        {
          collection.products?.nodes?.length > 1 ? (
            <Pagination connection={collection.products}>
              {({nodes, isLoading, PreviousLink, NextLink}) => (
                <>
                  <div className="flex items-center justify-center mb-6">
                    <Button as={PreviousLink} variant="secondary" width="full">
                      {isLoading ? 'Loading...' : 'Load previous'}
                    </Button>
                  </div>
                  <Grid layout="products">
                    {nodes.map((product, i) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                      />
                    ))}
                  </Grid>
                  <div className="flex items-center justify-center mt-6">
                    <Button as={NextLink} variant="secondary" width="full">
                      {isLoading ? 'Loading...' : 'Load more products'}
                    </Button>
                  </div>
                </>
              )}
            </Pagination>
        ) : (
          <div className='text-center'>
            <h3 className='mt-20 text-center text-xl font-bold'>
              Products not found
            </h3>
            <span className='text-zinc-600'>
              Try another filters
            </span>
          </div>
        )
        }
      </SortFilter>
    </>
  );
}

const COLLECTION_QUERY = `#graphql
  query CollectionDetails(
      $handle: String!,
      $filters: [ProductFilter!]
      $sortKey: ProductCollectionSortKeys!
      $reverse: Boolean
      $first: Int
      $last: Int
      $startCursor: String
      $endCursor: String
    ) {
    collection(handle: $handle) {
      id
      title
      description
      handle
      seo {
        description
        title
      }
      image {
        id
        url
        width
        height
        altText
      }
      products(
        first: $first,
        last: $last,
        before: $startCursor,
        after: $endCursor,
        filters: $filters,
        sortKey: $sortKey,
        reverse: $reverse
      ) {
        pageInfo {
          hasNextPage
          endCursor
        }
        filters {
          id
          label
          type
          values {
            id
            label
            count
            input
          }
        }
        nodes {
          id
          title
          publishedAt
          handle
          variants(first: 1) {
            nodes {
              id
              image {
                url
                altText
                width
                height
              }
              price {
                amount
                currencyCode
              }
              compareAtPrice {
                amount
                currencyCode
              }
            }
          }
        }
      }
    }
    collections(first: 100) {
      edges {
        node {
          title
          handle
        }
      }
    }
  }
`;

function getSortValuesFromParam(sortParam) {
  switch (sortParam) {
    case 'price-high-low':
      return {
        sortKey: 'PRICE',
        reverse: true,
      };
    case 'price-low-high':
      return {
        sortKey: 'PRICE',
        reverse: false,
      };
    case 'best-selling':
      return {
        sortKey: 'BEST_SELLING',
        reverse: false,
      };
    case 'newest':
      return {
        sortKey: 'CREATED',
        reverse: true,
      };
    case 'featured':
      return {
        sortKey: 'MANUAL',
        reverse: false,
      };
    default:
      return {
        sortKey: 'RELEVANCE',
        reverse: false,
      };
  }
}