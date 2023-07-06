// import function to register Swiper custom elements
import { register } from 'swiper/element/bundle';

import ProductCard from '~/components/ProductCard';

register();

/**
 * Display a slider with products and a heading based on some options.
 * This components uses the data from prompts
 * @see swiper https://swiperjs.com/element
 */
export default function ProductSlider({products, header = 'Featured products'}) {

  if (products?.edges?.length === 0) {
    return <p>No products found.</p>;
  }

  return (
    <>
      <h2>{header}</h2>
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