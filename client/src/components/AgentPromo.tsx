import { Link } from "wouter";

export default function AgentPromo() {
  return (
    <section id="for-agents" className="py-12 bg-gradient-to-r from-blue-600 to-primary text-white">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="md:w-1/2 mb-8 md:mb-0">
            <h2 className="text-2xl md:text-3xl font-bold font-heading mb-4">Become a Luxe Living Agent</h2>
            <p className="mb-6 text-white/90">
              Join our network of agents and earn commissions on every booking. Our AI system tracks your referrals automatically.
            </p>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center">
                <i className="fas fa-check-circle mr-2"></i>
                <span>Get your unique referral code</span>
              </li>
              <li className="flex items-center">
                <i className="fas fa-check-circle mr-2"></i>
                <span>Track your leads and commissions in real-time</span>
              </li>
              <li className="flex items-center">
                <i className="fas fa-check-circle mr-2"></i>
                <span>Receive automatic payments monthly</span>
              </li>
            </ul>
            <Link href="/agent-dashboard">
              <a className="bg-white text-primary px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition inline-block">
                Apply Now
              </a>
            </Link>
          </div>
          <div className="md:w-5/12">
            <div className="bg-white text-dark rounded-xl shadow-lg p-6">
              <h3 className="font-bold text-xl mb-4">Agent Dashboard Preview</h3>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-100 p-4 rounded-lg">
                  <div className="text-primary text-2xl font-bold">14</div>
                  <div className="text-gray-600 text-sm">Active Leads</div>
                </div>
                <div className="bg-gray-100 p-4 rounded-lg">
                  <div className="text-primary text-2xl font-bold">5</div>
                  <div className="text-gray-600 text-sm">Bookings</div>
                </div>
                <div className="bg-gray-100 p-4 rounded-lg">
                  <div className="text-primary text-2xl font-bold">₦45,000</div>
                  <div className="text-gray-600 text-sm">Commission</div>
                </div>
                <div className="bg-gray-100 p-4 rounded-lg">
                  <div className="text-primary text-2xl font-bold">AGT042</div>
                  <div className="text-gray-600 text-sm">Your Code</div>
                </div>
              </div>
              <div className="bg-gray-100 p-3 rounded-lg text-sm text-gray-500 italic">
                "The AI booking system has transformed my real estate business. I now earn passive income with minimal effort." - John D.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
