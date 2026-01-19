const AboutPage = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-8">About Us</h1>
      
      <div className="card mb-8">
        <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
        <p className="text-gray-700 leading-relaxed">
          We are committed to providing the freshest, highest quality organic produce 
          while supporting local farmers and promoting sustainable agriculture practices. 
          Our goal is to make healthy, organic food accessible to everyone.
        </p>
      </div>

      <div className="card mb-8">
        <h2 className="text-2xl font-semibold mb-4">Our Story</h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          Founded in 2020, Organic Produce Distribution started with a simple idea: 
          connect local organic farmers directly with consumers who value fresh, 
          sustainable produce.
        </p>
        <p className="text-gray-700 leading-relaxed">
          Today, we work with over 50 local farmers and deliver to thousands of 
          happy customers every week.
        </p>
      </div>

      <div className="card">
        <h2 className="text-2xl font-semibold mb-4">Our Values</h2>
        <ul className="space-y-3">
          <li className="flex items-start">
            <span className="text-primary-600 mr-2">✓</span>
            <span className="text-gray-700">Commitment to organic and sustainable farming</span>
          </li>
          <li className="flex items-start">
            <span className="text-primary-600 mr-2">✓</span>
            <span className="text-gray-700">Support for local farmers and communities</span>
          </li>
          <li className="flex items-start">
            <span className="text-primary-600 mr-2">✓</span>
            <span className="text-gray-700">Transparency in our supply chain</span>
          </li>
          <li className="flex items-start">
            <span className="text-primary-600 mr-2">✓</span>
            <span className="text-gray-700">Customer satisfaction and quality assurance</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default AboutPage;
