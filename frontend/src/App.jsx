import { Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useUserStore, initAuthInterceptor } from "./stores/useUserStore";
import { lazy, Suspense, useEffect } from "react";
import { useCartStore } from "./stores/useCartStore";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import LoadingSpinner from "./components/LoadingSpinner";

const HomePage = lazy(() => import("./pages/HomePage"));
const SignUpPage = lazy(() => import("./pages/SignUpPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const MyOrdersPage = lazy(() => import("./pages/MyOrdersPage"));
const OrderSummaryPage = lazy(() => import("./pages/OrderSummaryPage"));
const CartPage = lazy(() => import("./pages/CartPage"));
const PurchaseSuccessPage = lazy(() => import("./pages/PurchaseSuccessPage"));
const PurchaseCancelPage = lazy(() => import("./pages/PurchaseCancelPage"));

function App() {
	const { user, checkAuth, checkingAuth } = useUserStore();
	const { initCart } = useCartStore();
	
	useEffect(() => {
		// Initialize auth interceptor after mount
		initAuthInterceptor();
		checkAuth();
	}, [checkAuth]);

	useEffect(() => {
		// Defer cart hydration until after first paint
		if (typeof requestIdleCallback === 'function') {
			requestIdleCallback(() => {
				initCart();
			}, { timeout: 500 });
		} else {
			// Fallback for browsers without requestIdleCallback
			setTimeout(() => {
				initCart();
			}, 100);
		}
	}, [initCart]);

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
