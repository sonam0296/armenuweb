import Orders from "./components/OrderFile/Orders";
import liveTracking from "./components/LiveTracking/liveTracking";

export const driverRoutes=[
    {
      path: "/orders",
      name: "Orders",
      icon: "fab fa-first-order-alt text-orange",
      component: Orders,
    },
    {
      path: "/live-location",
      name: "Live-location",
      icon: "fas fa-globe text-blue",
      component: liveTracking,
    },
]
export default driverRoutes;