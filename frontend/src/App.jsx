import { Navigate, Route, Routes } from "react-router-dom";

import HomePage from "./pages/HomePage";
import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import AdminPage from "./pages/AdminPage";
import CategoryPage from "./pages/CategoryPage";
import MyOrdersPage from "./pages/MyOrdersPage";

import Navbar from "./components/Navbar";
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
		<div className='min-h-screen bg-black text-white relative overflow-hidden'>
			<div className='relative z-50 pt-16'>
				<Navbar />
				<Routes>
					<Route path='/' element={<HomePage />} />
					<Route path='/signup' element={!user ? <SignUpPage /> : <Navigate to='/' />} />
					<Route path='/login' element={!user ? <LoginPage /> : <Navigate to='/' />} />
					<Route
						path='/secret-dashboard'
						element={user?.role === "admin" ? <AdminPage /> : <Navigate to='/login' />}
					/>
					<Route path='/category/:category' element={<CategoryPage />} />
					<Route path='/cart' element={<CartPage />} />
					<Route path='/my-orders' element={user ? <MyOrdersPage /> : <Navigate to='/login' />} />
					<Route path='/purchase-success' element={<PurchaseSuccessPage />} />
					<Route path='/purchase-cancel' element={<PurchaseCancelPage />} />
				</Routes>
			</div>
			<Toaster 
				toastOptions={{
					style: {
						background: '#000',
						color: '#fff',
						border: '1px solid #333',
					},
				}}
			/>
		</div>
	);
}

export default App;
