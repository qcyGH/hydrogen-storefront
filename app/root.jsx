import {
  Links,
  Meta,
  Outlet,
  Scripts,
  useLocation,
  ScrollRestoration,
  useLoaderData,
} from '@remix-run/react';
import {
  Seo,
  AnalyticsEventName,
  getClientBrowserParameters,
  sendShopifyAnalytics,
  ShopifySalesChannel,
  useShopifyCookies,
} from '@shopify/hydrogen';
import tailwind from './styles/tailwind-build.css';
import styles from './styles/app.css';
import favicon from '../public/favicon.svg';
import {Layout} from './components/Layout';
import {defer} from '@shopify/remix-oxygen';
import {CART_QUERY} from '~/queries/cart';
import {useAnalyticsFromLoaders, useAnalyticsFromActions} from './utils';
import {useEffect} from 'react';

export const links = () => {
  return [
    {rel: 'stylesheet', href: tailwind},
    {rel: 'stylesheet', href: styles},
    {
      rel: 'preconnect',
      href: 'https://cdn.shopify.com',
    },
    {
      rel: 'preconnect',
      href: 'https://shop.app',
    },
    {rel: 'icon', type: 'image/svg+xml', href: favicon},
  ];
};

export async function loader({context, request}) {
  const cartId = await context.session.get('cartId');

  return defer({
    cart: cartId ? getCart(context, cartId) : undefined,
    layout: await context.storefront.query(LAYOUT_QUERY),
    analytics: {
      shopId: 'gid://shopify/Shop/1',
    },
  });
}

async function getCart({storefront}, cartId) {
  if (!storefront) {
    throw new Error('missing storefront client in cart query');
  }

  const {cart} = await storefront.query(CART_QUERY, {
    variables: {
      cartId,
      country: storefront.i18n.country,
      language: storefront.i18n.language,
    },
    cache: storefront.CacheNone(),
  });

  return cart;
}

export default function App() {
  const hasUserConsent = true;
  useShopifyCookies({hasUserConsent});
  const data = useLoaderData();
  const location = useLocation();

  const {name} = data.layout.shop;

  // Use the same data key defined in the loader
  const pageAnalytics = useAnalyticsFromLoaders();
  const analyticsFromActions = useAnalyticsFromActions();

  if (analyticsFromActions?.event === 'addToCart') {
    // Triggers when a successful add to cart event occurres

    const payload = {
      ...getClientBrowserParameters(),
      ...pageAnalytics,
      shopifySalesChannel: ShopifySalesChannel.hydrogen,
      cartId: analyticsFromActions.cartId,
    };

    sendShopifyAnalytics({
      eventName: AnalyticsEventName.ADD_TO_CART,
      payload,
    });
  }

  useEffect(() => {
    const payload = {
      ...getClientBrowserParameters(),
      ...pageAnalytics,
      hasUserConsent,
      shopifySalesChannel: ShopifySalesChannel.hydrogen,
    };

    sendShopifyAnalytics({
      eventName: AnalyticsEventName.PAGE_VIEW,
      payload,
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Seo />
        <Meta />
        <Links />
      </head>
      <body>
        <Layout title={name}>
          <Outlet />
        </Layout>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

const LAYOUT_QUERY = `#graphql
  query layout {
    shop {
      name
      description
    }
  }
`;

export const handle = {
  seo: {
    title: 'Snowdevil',
    titleTemplate: '%s - A custom Hydrogen storefront',
    description:
      'Hydrogen is a React-based framework for building headless storefronts on Shopify.',
  },
};