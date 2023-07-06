import {useLoaderData} from '@remix-run/react';
import {json} from '@shopify/remix-oxygen';

// import function to register Swiper custom elements
import { register } from 'swiper/element/bundle';

import ProductCard from '~/components/ProductCard';
import { useEffect } from 'react';

// register Swiper custom elements
register();

export async function loader({params, context, request}) {
  const first = 8;
  const sortKey = 'BEST_SELLING';

  const {products} = await context.storefront.query(PRODUCTS_QUERY, {
    variables: {
      first,
      sortKey,
    },
  });

  if (!products?.edges[0]?.node?.id) {
    throw new Response(null, {status: 404});
  }

  return json({
    products,
  });
}


/**
 * Display a slider with products and a heading based on some options.
 * This components uses the storefront API products query
 * @see swiper https://swiperjs.com/element
 * @see query https://shopify.dev/api/storefront/2023-04/queries/products
 * @see filters https://shopify.dev/api/storefront/2023-04/queries/products#argument-products-query
 */
export default function ProductSlider() {

  const {products} = useLoaderData()

  useEffect(() => {
    console.log(products)
  }, [products])

  if (products?.edges?.length === 0) {
    return <p>No products found.</p>;
  }

  return (
    <>
      <h2>Featured products</h2>
      <swiper-container
        slides-per-view="4"
        navigation="true"
        pagination="true"
      >
        {
          products?.edges?.map((product) => {
            return (
              <swiper-slide key={product.node.id}>
                <ProductCard product={product.node}/>
              </swiper-slide>
            )
          })
        }
      </swiper-container>
    </>
  );
};

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