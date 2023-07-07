// import Swiper core and required modules
import { Navigation, Pagination, Scrollbar, A11y } from 'swiper/modules';

import { Swiper, SwiperSlide } from 'swiper/react';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/scrollbar';

import ProductCard from '~/components/ProductCard';


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
      <Swiper
        // install Swiper modules
        modules={[Navigation, Pagination, Scrollbar, A11y]}
        spaceBetween={50}
        slidesPerView={3}
        navigation
        pagination={{ clickable: true }}
        scrollbar={{ draggable: true }}
      >
        {
          products?.map((product) => {
            return (
              <SwiperSlide key={product.id}>
                <ProductCard product={product}/>
              </SwiperSlide>
            )
          })
        }
      </Swiper>
    </div>
  );
};