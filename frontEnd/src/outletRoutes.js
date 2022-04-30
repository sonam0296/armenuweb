import Index from "components/Dashboard/Index";
import Restaurants from "components/Owner/Restaurants/Restaurants";
import Orders from "./components/OrderFile/Orders";

//import LiveOrder from "./components/Owner/LiveOrder/LiveOrder";
import LiveOrder from "./components/LiveOrders/LiveOrder";


import Menu from "components/Owner/Menu/Menu";
import Finance from "components/Owner/Finance/Finance";
import OwnerDriver from "components/Owner/OwnerDriver/OwnerDriver";
import CouponList  from "./components/Owner/Coupon/CouponList";
import InDine from "./components/Owner/InDine/InDine";
// import liveTracking from "./components/LiveTracking/liveTracking";
// import Maps from "./components/Owner/LiveTracking/Maps";


export const ownerRoutes=[
  {
    path: "/dashboard",
    name: "Dashboard",
    icon: "fas fa-tv text-primary",
    component: Index,
  },
  {
    path: "/live-orders",
    name: "Live Orders",
    icon: "ni ni-planet text-info",
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
    icon: "ni ni-shop text-green",
    component: Restaurants,
  },
  {
    path: "/menu",
    name: "Menu",
    icon: "fas fa-utensils text-gray",
    component: Menu,
  },
  {
    path: "/in-dine",
    name: "In-Dine",
    icon: "fas fa-wine-bottle text-blue fa-5x",
    component: InDine,
  },
  {
    path: "/coupon",
    name: "Coupon",
    icon: "far fa-money-bill-alt text-red",
    component: CouponList,
  },
  {
    path: "/finance",
    name: "Finance",
    icon: "fas fa-money-check text-info",
    component: Finance,
  },
  {
    path: "/add_owner_driver",
    name: "Drivers",
    icon: "fas fa-biking text-green",
    component: OwnerDriver,
  },
];

export default ownerRoutes;
