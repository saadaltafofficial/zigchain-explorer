import React from 'react';
import ContactForm from '../components/ContactForm';

export const metadata = {
  title: 'Contact Us - ZIGChain Explorer',
  description: 'Get in touch with the ZIGChain Explorer team',
};

export default function ContactPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Contact Us</h1>
      <p className="mb-8 text-gray-300">
        Have questions about ZIGChain or need assistance with the explorer? 
        Fill out the form below and our team will get back to you as soon as possible.
      </p>
      
      <ContactForm />
    </div>
  );
}
