import { Link } from "react-router-dom";

const CategoryItem = ({ category }) => {
	return (
		<div className='relative overflow-hidden h-96 w-full group border border-neutral-800'>
			<Link to={"/category" + category.href}>
				<div className='w-full h-full cursor-pointer'>
					<div className='absolute inset-0 bg-gradient-to-b from-transparent to-black opacity-60 z-10' />
					<img
						src={category.imageUrl}
						alt={category.name}
						className='w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105'
						loading='lazy'
					/>
					<div className='absolute bottom-0 left-0 right-0 p-6 z-20'>
						<h3 className='text-white text-xl font-medium mb-1'>{category.name}</h3>
						<p className='text-neutral-400 text-xs uppercase tracking-wide'>Explore Collection</p>
					</div>
				</div>
			</Link>
		</div>
	);
};

export default CategoryItem;
