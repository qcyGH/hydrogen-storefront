import {useLoaderData, Link} from '@remix-run/react';
import {Image} from '@shopify/hydrogen';
import {json} from '@shopify/remix-oxygen';
import ProductSlider from '~/components/ProductSlider';

export async function loader({context}) {

  const first = 8;
  const sortKey = 'BEST_SELLING';

  const {products} = await context.storefront.query(PRODUCTS_QUERY, {
    variables: {
      first,
      sortKey,
    },
  });

  const {collections} = await context.storefront.query(COLLECTIONS_QUERY)

  return json({
    products,
    collections
  });
}

export default function Index() {
  const {products, collections} = useLoaderData();
  return (
    <>
    <section className='w-full'>
      <ProductSlider products={products.edges}/>
    </section>
    <section className="w-full gap-4">
      <h2 className="whitespace-pre-wrap max-w-prose font-bold text-lead">
        Collections
      </h2>
      <div className="grid-flow-row grid gap-2 gap-y-6 md:gap-4 lg:gap-6 grid-cols-1 sm:grid-cols-3">
        {collections?.nodes?.map((collection) => {
          return (
            <Link to={`/collections/${collection.handle}`} key={collection.id}>
              <div className="grid gap-4">
                {collection?.image && (
                  <Image
                    alt={`Image of ${collection.title}`}
                    data={collection.image}
                    key={collection.id}
                    sizes="(max-width: 32em) 100vw, 33vw"
                  />
                )}
                <h2 className="whitespace-pre-wrap max-w-prose font-medium text-copy">
                  {collection.title}
                </h2>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
    </>
  );
}

const COLLECTIONS_QUERY = `#graphql
  query FeaturedCollections {
    collections(first: 3, query: "collection_type:smart") {
      nodes {
        id
        title
        handle
        image {
          altText
          width
          height
          url
        }
      }
    }
  }
`;

const PRODUCTS_QUERY = `#graphql
  query getProducts($first: Int, $sortKey: ProductSortKeys) {
    products(first: $first, sortKey: $sortKey) {
      edges {
        cursor
        node {
          id
          title
          handle
          variants(first: 1) {
            nodes {
              id
              title
              availableForSale
              image {
                id
                url
                altText
                width
                height
              }
              price {
                currencyCode
                amount
              }
              compareAtPrice {
                currencyCode
                amount
              }
              selectedOptions {
                name
                value
              }
            }
          }
        }
      }
    }
  }
`