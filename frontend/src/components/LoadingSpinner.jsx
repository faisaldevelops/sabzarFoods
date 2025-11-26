import { Loader } from "lucide-react";

const LoadingSpinner = () => {
	return (
		<div className='flex items-center justify-center min-h-screen bg-stone-50'>
			<div className='flex flex-col items-center gap-3'>
				<Loader className='w-12 h-12 text-stone-800 animate-spin' />
				<p className='text-sm text-stone-600 font-medium'>Loading...</p>
			</div>
		</div>
	);
};

export default LoadingSpinner;
