import { ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";
import { useUserStore } from "../stores/useUserStore";
import { useCartStore } from "../stores/useCartStore";

const Navbar = () => {
	const { user, logout } = useUserStore();
	const isAdmin = user?.role === "admin";
	const { cart } = useCartStore();

	return (
		<header className='fixed top-0 left-0 w-full bg-black border-b border-neutral-800 z-40'>
			<div className='container mx-auto px-4 py-4'>
				<div className='flex justify-between items-center'>
					<Link to='/' className='text-xl font-semibold tracking-tight'>
						URBAN K
					</Link>

					<nav className='flex items-center gap-6'>
						<Link
							to={"/"}
							className='text-sm text-neutral-400 hover:text-white transition-colors'
						>
							Home
						</Link>
						{user && (
							<Link
								to={"/my-orders"}
								className='text-sm text-neutral-400 hover:text-white transition-colors'
							>
								Orders
							</Link>
						)}
						<Link
							to={"/cart"}
							className='relative text-sm text-neutral-400 hover:text-white transition-colors flex items-center gap-1'
						>
							Cart
							{cart.length > 0 && (
								<span
									className='absolute -top-2 -right-2 bg-white text-black text-xs px-1.5 py-0.5 font-medium'
								>
									{cart.length}
								</span>
							)}
						</Link>
						{isAdmin && (
							<Link
								className='text-sm bg-white text-black px-4 py-2 font-medium hover:bg-neutral-200 transition-colors'
								to={"/secret-dashboard"}
							>
								Dashboard
							</Link>
						)}

						{user ? (
							<button
								className='text-sm border border-neutral-700 text-white px-4 py-2 hover:bg-neutral-900 transition-colors'
								onClick={logout}
							>
								Logout
							</button>
						) : (
							<>
								<Link
									to={"/signup"}
									className='text-sm bg-white text-black px-4 py-2 font-medium hover:bg-neutral-200 transition-colors'
								>
									Sign Up
								</Link>
								<Link
									to={"/login"}
									className='text-sm border border-neutral-700 text-white px-4 py-2 hover:bg-neutral-900 transition-colors'
								>
									Login
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
