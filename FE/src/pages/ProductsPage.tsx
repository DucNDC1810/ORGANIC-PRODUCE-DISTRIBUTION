const ProductsPage = () => {
  return (
    <div>
      <h1 className="text-4xl font-bold mb-8">Our Products</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
          <div key={item} className="card hover:shadow-lg transition-shadow">
            <div className="bg-gray-200 h-48 rounded-md mb-4"></div>
            <h3 className="text-lg font-semibold mb-2">Product {item}</h3>
            <p className="text-gray-600 mb-4">Fresh organic produce</p>
            <div className="flex justify-between items-center">
              <span className="text-2xl font-bold text-primary-600">$10.99</span>
              <button className="btn-primary">Add to Cart</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductsPage;
