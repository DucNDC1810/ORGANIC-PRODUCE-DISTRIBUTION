const HomePage = () => {
  return (
    <div>
      <section className="text-center py-16">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Welcome to Organic Produce
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Fresh, healthy, and sustainable produce delivered to your door
        </p>
        <button className="btn-primary text-lg px-8 py-3">
          Shop Now
        </button>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 py-12">
        <div className="card text-center">
          <div className="text-4xl mb-4">🌱</div>
          <h3 className="text-xl font-semibold mb-2">100% Organic</h3>
          <p className="text-gray-600">
            All our produce is certified organic and pesticide-free
          </p>
        </div>

        <div className="card text-center">
          <div className="text-4xl mb-4">🚚</div>
          <h3 className="text-xl font-semibold mb-2">Fast Delivery</h3>
          <p className="text-gray-600">
            Fresh produce delivered within 24 hours
          </p>
        </div>

        <div className="card text-center">
          <div className="text-4xl mb-4">🌍</div>
          <h3 className="text-xl font-semibold mb-2">Eco-Friendly</h3>
          <p className="text-gray-600">
            Supporting sustainable farming practices
          </p>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
