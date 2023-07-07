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

  if (products?.length === 0) {
    return <p>No products found.</p>;
  }

  return (
    <div className='max-w-[100vw]'>
      <h2>{header}</h2>
      <swiper-container
        slides-per-view="4"
        navigation="true"
        pagination="true"
      >
        {
          products?.map((product) => {
            return (
              <swiper-slide key={product.id}>
                <ProductCard product={product}/>
              </swiper-slide>
            )
          })
        }
      </swiper-container>
    </div>
  );
};