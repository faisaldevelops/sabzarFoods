import { Home, ShoppingCart, User, LogOut, LogIn, LayoutDashboard } from "lucide-react";
import { Link } from "react-router-dom";
import { useUserStore } from "../stores/useUserStore";
import { useCartStore } from "../stores/useCartStore";
import { useState } from "react";
import { motion } from "framer-motion";

const Navbar = () => {
	const { user, logout } = useUserStore();
	const isAdmin = user?.role === "admin";
	const { cart } = useCartStore();
	const [showLogoutModal, setShowLogoutModal] = useState(false);

	const handleLogoutClick = () => {
		setShowLogoutModal(true);
	};

	const handleConfirmLogout = () => {
		setShowLogoutModal(false);
		logout();
	};

	const handleCancelLogout = () => {
		setShowLogoutModal(false);
	};

	return (
		<>
		<header className='fixed top-0 left-0 w-full bg-stone-50 border-b border-stone-200 z-40 shadow-sm'>
			<div className='container mx-auto px-4 py-3'>
				<div className='flex justify-between items-center'>
					<Link
						to="/"
						className="flex flex-col leading-tight font-serif font-bold text-stone-900 tracking-tight"
					>
						<span className="text-3xl">Sabzar</span>
						<span className="text-xl -mt-1">Foods</span>
					</Link>


					<nav className='flex items-center gap-2'>
						<Link
							to={"/"}
							className='flex items-center gap-2 px-3 py-2 text-stone-700 hover:bg-stone-100 rounded-md transition-colors'
							title="Home"
						>
							<Home size={20} />
							<span className='text-sm font-medium hidden sm:inline'>Home</span>
						</Link>
						{user && (
							<Link
								to={"/my-orders"}
								className='flex items-center gap-2 px-3 py-2 text-stone-700 hover:bg-stone-100 rounded-md transition-colors'
								title="My Orders"
							>
								<User size={20} />
								<span className='text-sm font-medium hidden sm:inline'>Orders</span>
							</Link>
						)}
						<Link
							to={"/cart"}
							className='relative flex items-center gap-2 px-3 py-2 text-stone-700 hover:bg-stone-100 rounded-md transition-colors'
							title="Shopping Cart"
						>
							<ShoppingCart size={20} />
							<span className='text-sm font-medium hidden sm:inline'>Cart</span>
							{cart.length > 0 && (
								<span
									className='absolute -top-1 -right-1 bg-stone-800 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full font-medium'
								>
									{cart.length}
								</span>
							)}
						</Link>
						{isAdmin && (
							<Link
								className='flex items-center gap-2 px-3 py-2 bg-stone-800 text-white hover:bg-stone-700 rounded-md transition-colors'
								to={"/secret-dashboard"}
								title="Admin Dashboard"
							>
								<LayoutDashboard size={20} />
								<span className='text-sm font-medium hidden sm:inline'>Dashboard</span>
							</Link>
						)}

						{user ? (
							<button
								className='flex items-center gap-2 px-3 py-2 bg-red-600 text-white hover:bg-red-700 rounded-md transition-colors'
								onClick={handleLogoutClick}
								title="Logout"
							>
								<LogOut size={20} />
								<span className='text-sm font-medium hidden sm:inline'>Logout</span>
							</button>
						) : (
							<>
								<Link
									to={"/login"}
									className='flex items-center gap-2 px-3 py-2 bg-stone-800 text-white hover:bg-stone-700 rounded-md transition-colors'
									title="Login"
								>
									<LogIn size={20} />
									<span className='text-sm font-medium'>Login</span>
								</Link>
							</>
						)}
					</nav>
				</div>
			</div>
		</header>

		{/* Logout Confirmation Modal */}
		{showLogoutModal && (
			<div className="fixed inset-0 z-50 flex items-center justify-center">
				<motion.div
					className="absolute inset-0 bg-black/50"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					onClick={handleCancelLogout}
				/>
				<motion.div
					className="relative z-10 w-full max-w-sm rounded-lg border border-stone-200 bg-white p-6 shadow-xl mx-4"
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.25 }}
				>
					<h3 className="text-xl font-bold text-stone-900 mb-3">
						Confirm Logout
					</h3>
					<p className="text-stone-600 mb-6">
						Are you sure you want to logout?
					</p>
					<div className="flex gap-3">
						<button
							onClick={handleCancelLogout}
							className="flex-1 px-4 py-2 rounded-md border border-stone-300 text-stone-700 hover:bg-stone-50 transition-colors font-medium"
						>
							Cancel
						</button>
						<button
							onClick={handleConfirmLogout}
							className="flex-1 px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors font-medium"
						>
							Logout
						</button>
					</div>
				</motion.div>
			</div>
		)}
		</>
	);
};
export default Navbar;
