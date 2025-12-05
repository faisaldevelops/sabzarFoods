import { Home, ShoppingCart, Package, LogOut, LogIn, UserPlus, LayoutDashboard } from "lucide-react";
import { Link } from "react-router-dom";
import { useUserStore } from "../stores/useUserStore";
import { useCartStore } from "../stores/useCartStore";

const Navbar = () => {
	const { user, logout } = useUserStore();
	const isAdmin = user?.role === "admin";
	const { cart } = useCartStore();

	return (
		<header className='fixed top-0 left-0 w-full bg-stone-50 border-b border-stone-200 z-40 shadow-sm'>
			<div className='container mx-auto px-4 py-3'>
				<div className='flex justify-between items-center'>
					<Link to='/' className='text-2xl font-bold tracking-tight text-stone-900'>
						Sabzar Foods
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
								<Package size={20} />
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
								className='flex items-center gap-2 px-3 py-2 border border-stone-300 text-stone-700 hover:bg-stone-100 rounded-md transition-colors'
								onClick={logout}
								title="Logout"
							>
								<LogOut size={20} />
								<span className='text-sm font-medium hidden sm:inline'>Logout</span>
							</button>
						) : (
							<>
								<Link
									to={"/signup"}
									className='flex items-center gap-2 px-3 py-2 bg-stone-800 text-white hover:bg-stone-700 rounded-md transition-colors'
									title="Sign Up"
								>
									<UserPlus size={20} />
									<span className='text-sm font-medium hidden sm:inline'>Sign Up</span>
								</Link>
								<Link
									to={"/login"}
									className='flex items-center gap-2 px-3 py-2 border border-stone-300 text-stone-700 hover:bg-stone-100 rounded-md transition-colors'
									title="Login"
								>
									<LogIn size={20} />
									<span className='text-sm font-medium hidden sm:inline'>Login</span>
								</Link>
							</>
						)}
					</nav>
				</div>
			</div>
		</header>
	);
};
export default Navbar;
