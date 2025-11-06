import Order from "../models/order.model.js";

export const getOrdersData = async (req, res) => {
    // try {
	// 	const orders = await Order.find({}); // find all products
	// 	// console.log("I am in the BE of Orders");
		
	// 	res.json({ orders });
	// 	// console.log(orders);
		
	// } catch (error) {
	// 	console.log("Error in getAllOrders controller", error.message);
	// 	res.status(500).json({ message: "Server error", error: error.message });
	// }

	try {
    // Find all orders and populate the user and product references.
    // Select a few useful user fields and product fields to return.
    const orders = await Order.find()
      .populate('user', 'name email') // populate user name + email
      .populate({
        path: 'products.product',
        select: 'name price image',
        // select: 'name price image category description isFeatured', // product fields to include
      })
      .lean(); // convert to plain JS objects

    // Format each order to merge product details alongside quantity/price
    const formatted = orders.map(order => {
      const products = (order.products || []).map(p => {
        const prod = p.product; // populated product document (or null if missing)
        return {
          // productId: prod?._id ?? null,
          name: prod?.name ?? 'PRODUCT_REMOVED',
          // description: prod?.description ?? '',
          price: prod?.price ?? p.price ?? null, // fallback to stored price in order
          image: prod?.image ?? null,
          category: prod?.category ?? null,
          // isFeatured: prod?.isFeatured ?? false,
          quantity: p.quantity ?? 0,
          // orderItemId: p._id ?? null, // the order's products array item id
        };
      });

      return {
        // orderId: order._id,
        // stripeSessionId: order.stripeSessionId ?? null,
        totalAmount: order.totalAmount ?? null,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        user: order.user ? {
          userId: order.user._id,
          name: order.user.name,
          email: order.user.email,
        } : null,
        products,
        address: order.address,
        // rawOrder: order // optional: the original order object if you want it
      };
    });

    return res.json({ success: true, data: formatted });
  } catch (err) {
    console.error('Error fetching orders:', err);
    return res.status(500).json({ success: false, message: 'Server error fetching orders' });
  }
};