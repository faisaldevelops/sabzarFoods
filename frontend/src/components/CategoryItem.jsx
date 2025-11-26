import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const CategoryItem = ({ category }) => {
	return (
		<div className='relative overflow-hidden h-96 w-full group rounded-lg border border-stone-200 shadow-sm hover:shadow-xl transition-all duration-300'>
			<Link to={"/category" + category.href}>
				<div className='w-full h-full cursor-pointer'>
					<div className='absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-stone-900 opacity-70 z-10' />
					<img
						src={category.imageUrl}
						alt={category.name}
						className='w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110'
						loading='lazy'
					/>
					<div className='absolute bottom-0 left-0 right-0 p-6 z-20'>
						<h3 className='text-white text-2xl font-bold mb-2'>{category.name}</h3>
						<div className='flex items-center gap-2 text-stone-200 text-sm font-medium group-hover:gap-3 transition-all'>
							<span>Explore Collection</span>
							<ArrowRight size={16} className='group-hover:translate-x-1 transition-transform' />
						</div>
					</div>
				</div>
			</Link>
		</div>
	);
};

export default CategoryItem;
