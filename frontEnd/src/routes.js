

import Index from "components/Dashboard/Index";
import Restaurants from "components/Admin/Pages/Restaurants/Restaurants";
import Orders from "components/OrderFile/Orders";
import Pages from "components/Admin/Pages/PagesFooterLink/PageList";
import Clients from "components/Admin/Pages/Client/ClientList";
import DriverList from "./components/Admin/Pages/Driver/DriverList";

//import LiveOrder from "components/Admin/Pages/LiveOrder/LiveOrder";
import LiveOrder from "components/LiveOrders/LiveOrder";


import Settings from "components/Admin/Pages/SiteSetting/Setting";
import Review from "components/Admin/Pages/Review/Review";
import CityList from "components/Admin/Pages/City/CityList";
import Finances from "components/Admin/Pages/Finances/Finances";
import PlanList from "components/Admin/Pages/SubScriptionPlan/PlanList";

import AggregatorList from "components/Admin/Pages/Aggregator/AggregatorList";

import tourList from "components/Admin/Pages/Tour/tourList";




const adminRoutes = [
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
    component: PlanList,
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
    path: "/drivers",
    name: "Drivers",
    icon: "ni ni-bullet-list-67 text-red",
    component: DriverList,
  },
  {
    path: "/clients",
    name: "Clients",
    icon: "fas fa-user-friends text-green",
    component: Clients,
  },
  {
    path: "/restaurants",
    name: "Restaurants",
    icon: "fas fa-utensils text-pink",
    component: Restaurants,
  },
  {
    path: "/aggregator",
    name: "Driver Aggregator",
    icon: "fas fa-handshake text-red",
    component: AggregatorList,
  },
  {
    path: "/review",
    name: "Review",
    icon: "fas fa-star text-info",
    component: Review,
  },
  {
    path: "/city",
    name: "City",
    icon: "fas fa-city text-yellow",
    component: CityList,
  },
  {
    path: "/pages",
    name: "Pages", 
    icon: "fas fa-file text-green",
    component: Pages,
  },
  {
    path: "/finances",
    name: "Finance",
    icon: "fas fa-money-check text-info",
    component: Finances,
  },
  {
    path: "/tour-hint",
    name: "Tour",
    icon: "far fa-newspaper text-red",
    component: tourList,
  },
  {
    path: "/settings",
    name: "Settings",
    icon: "fas fa-tools text-gray",
    component: Settings,
  },
];


export default adminRoutes;
