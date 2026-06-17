import React from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../ui/BackButton.jsx';

const Contact = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen lg:h-[100dvh] lg:overflow-hidden bg-[#F8FAFC] flex flex-col justify-center">
      <div className="w-full max-w-6xl mx-auto py-8 lg:py-0 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 mb-12">
          <BackButton onClick={() => navigate('/more')} />
          <h1 className="text-4xl md:text-5xl font-black text-blue-700 tracking-tight">Contact Us</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Info */}
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Get in Touch</h2>
              <p className="text-lg text-gray-600 mb-8">
                Have questions about Hoshiyaar? We're here to help you on your learning journey.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Email Us</h3>
                  <a href="mailto:cg.hoshiyaar@gmail.com" className="text-blue-600 hover:underline">cg.hoshiyaar@gmail.com</a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center text-green-600 shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Call Us</h3>
                  <a href="tel:7021970672" className="text-blue-600 hover:underline">7021970672</a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Follow Us</h3>
                  <div className="flex gap-4 mt-2">
                    <a href="https://www.instagram.com/hoshiyaar_club/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-pink-600 transition-colors">Instagram</a>
                    <a href="https://www.youtube.com/@Hoshi-yaar" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-red-600 transition-colors">YouTube</a>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center text-green-600 shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Working Hours</h3>
                  <p className="text-gray-600">Monday - Friday, 9:00 AM - 6:00 PM IST</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form Placeholder */}
          <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
            <form className="space-y-4" onSubmit={(e) => { 
              e.preventDefault(); 
              const name = e.target.name.value;
              const email = e.target.email.value;
              const message = e.target.message.value;
              const text = `Hi Hoshiyaar Support,\n\nMy name is ${name} (${email}).\n\nMy Query:\n${message}`;
              const whatsappUrl = `https://wa.me/917021970672?text=${encodeURIComponent(text)}`;
              window.open(whatsappUrl, '_blank');
            }}>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Your Name</label>
                <input name="name" type="text" className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-blue-500 focus:outline-none transition-all" placeholder="Enter your name" required />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Email Address (Optional)</label>
                <input name="email" type="email" className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-blue-500 focus:outline-none transition-all" placeholder="Enter your email" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Message</label>
                <textarea name="message" rows="4" className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-blue-500 focus:outline-none transition-all" placeholder="How can we help?" required></textarea>
              </div>
              <button type="submit" className="w-full bg-[#25D366] text-white font-black py-4 rounded-xl shadow-lg hover:bg-[#128C7E] flex items-center justify-center gap-2 transition-all active:scale-[0.98]">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                Send via WhatsApp
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
