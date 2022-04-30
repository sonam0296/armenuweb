import Index from "components/Dashboard/Index";
import Restaurants from "./components/Admin/Pages/Restaurants/Restaurants";
import Orders from "./components/OrderFile/Orders";

//import LiveOrder from "./components/Owner/LiveOrder/LiveOrder";
import LiveOrder from "./components/LiveOrders/LiveOrder";

import Finance from "components/Owner/Finance/Finance";
import OwnerDriver from "components/Owner/OwnerDriver/OwnerDriver";
import subscriptionPlan from "./components/Owner/SubscriptionPlan/SubscriptionPlan"


export const driverAggregatorRoute=[
  {
    path: "/dashboard",
    name: "Dashboard",
    icon: "fas fa-tv text-primary",
    component: Index,
  },
  {
    path: "/subscription-plan",
    name: "Subscription Plans",
    icon: "ni ni-circle-08 text-pink",
    component: subscriptionPlan,
  },
  {
    path: "/live-orders",
    name: "Live Orders",
    icon: "ni ni-planet text-blue",
    component: LiveOrder,
  },
  {
    path: "/orders",
    name: "Orders",
    icon: "fab fa-first-order-alt text-orange",
    component: Orders,
  },
  {
    path: "/restaurants",
    name: "Restaurants",
    icon: "ni ni-shop text-red ",
    component: Restaurants,
  },
  // {
  //   path: "/finance",
  //   name: "Finance",
  //   icon: "fas fa-money-check text-info",
  //   component: Finance,
  // },
  {
    path: "/drivers",
    name: "Drivers",
    icon: "fas fa-biking text-green",
    component: OwnerDriver,
  },
];

export default driverAggregatorRoute;
