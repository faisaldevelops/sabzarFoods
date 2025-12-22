import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const SalesChart = ({ dailySalesData }) => {
	return (
		<motion.div
			className='bg-gray-800/60 rounded-lg p-6 shadow-lg'
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5, delay: 0.25 }}
		>
			<ResponsiveContainer width='100%' height={400}>
				<LineChart data={dailySalesData}>
					<CartesianGrid strokeDasharray='3 3' />
					<XAxis dataKey='name' stroke='#D1D5DB' />
					<YAxis yAxisId='left' stroke='#D1D5DB' />
					<YAxis yAxisId='right' orientation='right' stroke='#D1D5DB' />
					<Tooltip />
					<Legend />
					<Line
						yAxisId='left'
						type='monotone'
						dataKey='sales'
						stroke='#10B981'
						activeDot={{ r: 8 }}
						name='Sales'
					/>
					<Line
						yAxisId='right'
						type='monotone'
						dataKey='revenue'
						stroke='#3B82F6'
						activeDot={{ r: 8 }}
						name='Revenue'
					/>
				</LineChart>
			</ResponsiveContainer>
		</motion.div>
	);
};

export default SalesChart;
