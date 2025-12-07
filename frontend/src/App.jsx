import { Navigate, Route, Routes } from "react-router-dom";

import HomePage from "./pages/HomePage";
import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import AdminPage from "./pages/AdminPage";
import MyOrdersPage from "./pages/MyOrdersPage";
import OrderSummaryPage from "./pages/OrderSummaryPage";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { Toaster } from "react-hot-toast";
import { useUserStore } from "./stores/useUserStore";
import { useEffect } from "react";
import LoadingSpinner from "./components/LoadingSpinner";
import CartPage from "./pages/CartPage";
import { useCartStore } from "./stores/useCartStore";
import { useAddressStore } from "./stores/useAddressStore";
import PurchaseSuccessPage from "./pages/PurchaseSuccessPage";
import PurchaseCancelPage from "./pages/PurchaseCancelPage";

function App() {
	const { user, checkAuth, checkingAuth } = useUserStore();
	const { initCart } = useCartStore();
	const { fetchAddresses } = useAddressStore();
	
	useEffect(() => {
		checkAuth();
	}, [checkAuth]);

	useEffect(() => {
		// Initialize cart from localStorage on app load
		initCart();
	}, [initCart]);

	useEffect(() => {
		// Fetch addresses when user is logged in
		if (user) {
			fetchAddresses();
		}
	}, [user, fetchAddresses]);

	if (checkingAuth) return <LoadingSpinner />;

	return (
		<div className='min-h-screen bg-stone-50 text-stone-900 relative overflow-hidden flex flex-col'>
			<div className='relative z-50 pt-16 flex-1'>
				<Navbar />
				<Routes>
					<Route path='/' element={<HomePage />} />
					<Route path='/signup' element={!user ? <SignUpPage /> : <Navigate to='/' />} />
					<Route path='/login' element={!user ? <LoginPage /> : <Navigate to='/' />} />
					<Route
						path='/secret-dashboard'
						element={user?.role === "admin" ? <AdminPage /> : <Navigate to='/login' />}
					/>
					<Route path='/cart' element={<CartPage />} />
					<Route path='/order-summary' element={user ? <OrderSummaryPage /> : <Navigate to='/login' />} />
					<Route path='/my-orders' element={user ? <MyOrdersPage /> : <Navigate to='/login' />} />
					<Route path='/purchase-success' element={<PurchaseSuccessPage />} />
					<Route path='/purchase-cancel' element={<PurchaseCancelPage />} />
				</Routes>
			</div>
			<Footer />
			<Toaster 
				toastOptions={{
					style: {
						background: '#fff',
						color: '#1c1917',
						border: '1px solid #e7e5e4',
						boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
					},
				}}
			/>
		</div>
	);
}

export default App;
