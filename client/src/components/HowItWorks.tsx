export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold font-heading text-dark mb-3">How It Works</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Our AI-powered booking system makes finding and booking your perfect short-let property faster and easier than ever before.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-xl shadow text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-comments text-2xl text-primary"></i>
            </div>
            <h3 className="font-bold text-lg mb-3">Chat with our AI</h3>
            <p className="text-gray-600">
              Tell our AI your preferences, budget, and dates through WhatsApp or our website.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-building text-2xl text-primary"></i>
            </div>
            <h3 className="font-bold text-lg mb-3">Get Personalized Matches</h3>
            <p className="text-gray-600">
              Our system matches your requirements with available properties instantly.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-calendar-check text-2xl text-primary"></i>
            </div>
            <h3 className="font-bold text-lg mb-3">Book & Enjoy</h3>
            <p className="text-gray-600">
              Confirm your booking with secure payment and receive instant confirmation.
            </p>
          </div>
        </div>

        <div className="mt-12 text-center">
          <button className="bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition">
            Start Your Booking
          </button>
        </div>
      </div>
    </section>
  );
}
