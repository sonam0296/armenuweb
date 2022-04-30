import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux'
import { Link, Redirect } from 'react-router-dom';
import Layout from './Layout';
// import { myCart } from '../actions/cartAction';
import Card from './Card';
import Checkout from './Checkout'

const Cart = () => {
    // const [run, setRun] = useState(false);
    // const dispatch = useDispatch()

    const cartReducer = useSelector(state => state.cartReducer)
    const items = cartReducer.cartProduct

    // useEffect(() => {
    // if (userReducer.loggedIn) {
    // dispatch(myCart(userId))
    // }
    // }, [])

    const showItems = items => {
        return (
            <div>
                <h2>Your cart has {`${items.length}`} items</h2>
                <hr />
                {items.map((product, i) => (

                    <Card
                        key={i}
                        product={product}
                        showAddToCartButton={false}
                        cartUpdate={true}
                        showCartTime={true}
                        showRemoveProductButton={true}
                    // setRun={setRun}
                    // run={run}
                    />
                ))}
            </div>
        );
    };
    const noItemsMessage = () => (
        <h2>
            Your cart is empty. <br /> <Link to="/">Continue shopping</Link>
        </h2>
    );

    return (
        <Layout
            title="Shopping Cart"
            description="Manage your cart items. Add remove checkout or continue shopping."
            className="container-fluid">
            <div className="row">
                <div className="col-6 ">{cartReducer.cartProduct.length > 0 ? showItems(items) : noItemsMessage()}</div>
                <div className="col-6">
                    <h2 className="mb-4">Your cart summary</h2>
                    <Checkout products={items} />
                    <hr />
                </div>
            </div>
        </Layout>
    );
};

export default Cart;