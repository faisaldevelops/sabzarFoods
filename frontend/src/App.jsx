import { Navigate, Route, Routes } from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";

const HomePage = lazy(() => import("./pages/HomePage"));
const SignUpPage = lazy(() => import("./pages/SignUpPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const MyOrdersPage = lazy(() => import("./pages/MyOrdersPage"));
const OrderSummaryPage = lazy(() => import("./pages/OrderSummaryPage"));
const CartPage = lazy(() => import("./pages/CartPage"));
const PurchaseSuccessPage = lazy(() => import("./pages/PurchaseSuccessPage"));
const PurchaseCancelPage = lazy(() => import("./pages/PurchaseCancelPage"));
const RefundPolicyPage = lazy(() => import("./pages/RefundPolicyPage"));

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { Toaster } from "react-hot-toast";
import { useUserStore } from "./stores/useUserStore";
import LoadingSpinner from "./components/LoadingSpinner";
import { useCartStore } from "./stores/useCartStore";
import { useAddressStore } from "./stores/useAddressStore";

function App() {
	const { user, checkAuth, checkingAuth } = useUserStore();
	const { initCart } = useCartStore();
	const { fetchAddresses } = useAddressStore();
	
	useEffect(() => {
		checkAuth();
	}, [checkAuth]);

	useEffect(() => {
		initCart();
	}, [initCart]);

	useEffect(() => {
		if (user) {
			fetchAddresses();
		}
	}, [user, fetchAddresses]);

	if (checkingAuth) return <LoadingSpinner />;

	return (
		<div className='min-h-screen bg-stone-50 text-stone-900 relative overflow-hidden flex flex-col'>
			<div className='relative z-50 pt-16 flex-1'>
				<Navbar />
				<Suspense fallback={<LoadingSpinner />}>
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
						<Route path='/refund-policy' element={<RefundPolicyPage />} />
						<Route path='/purchase-success' element={<PurchaseSuccessPage />} />
						<Route path='/purchase-cancel' element={<PurchaseCancelPage />} />
					</Routes>
				</Suspense>
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
