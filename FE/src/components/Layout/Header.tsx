import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <header className="bg-white shadow-sm">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold text-primary-600">
            Organic Produce
          </Link>
          
          <ul className="flex gap-6">
            <li>
              <Link 
                to="/" 
                className="text-gray-700 hover:text-primary-600 transition-colors"
              >
                Home
              </Link>
            </li>
            <li>
              <Link 
                to="/products" 
                className="text-gray-700 hover:text-primary-600 transition-colors"
              >
                Products
              </Link>
            </li>
            <li>
              <Link 
                to="/about" 
                className="text-gray-700 hover:text-primary-600 transition-colors"
              >
                About
              </Link>
            </li>
          </ul>
        </div>
      </nav>
    </header>
  );
};

export default Header;
