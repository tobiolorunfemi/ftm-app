"use client";

import { useState, useEffect } from "react";
import { Loader2, Check, Mail, Phone, MessageCircle, Globe } from "lucide-react";

type Contact = {
  name?: string | null;
  organisation?: string | null;
  email?: string | null;
  phone?: string | null;
  facebook?: string | null;
  instagram?: string | null;
  twitter?: string | null;
  whatsapp?: string | null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function ContactPanel({ tournament }: { tournament: any }) {
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Contact>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Contact form state
  const [enquiryName, setEnquiryName] = useState("");
  const [enquiryEmail, setEnquiryEmail] = useState("");
  const [enquiryMsg, setEnquiryMsg] = useState("");
  const [sendingEnquiry, setSendingEnquiry] = useState(false);
  const [enquirySent, setEnquirySent] = useState(false);

  useEffect(() => {
    fetch(`/api/tournaments/${tournament.id}/contact`)
      .then((r) => r.json())
      .then((data) => {
        setContact(data);
        setForm(data ?? {});
        setLoading(false);
      });
  }, [tournament.id]);

  const saveContact = async () => {
    setSaving(true);
    const res = await fetch(`/api/tournaments/${tournament.id}/contact`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setContact(data);
    setSaving(false);
    setSaved(true);
    setEditing(false);
    setTimeout(() => setSaved(false), 2000);
  };

  const sendEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingEnquiry(true);
    // Simulate send (in production, POST to a backend email handler)
    await new Promise((r) => setTimeout(r, 800));
    setSendingEnquiry(false);
    setEnquirySent(true);
    setEnquiryName("");
    setEnquiryEmail("");
    setEnquiryMsg("");
  };

  const field = (key: keyof Contact, label: string, placeholder: string, type = "text") => (
    <div key={key}>
      <label className="text-[10px] text-gray-500">{label}</label>
      <input
        type={type}
        value={(form[key] as string) ?? ""}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        className="w-full border rounded px-2 py-1 text-sm"
        placeholder={placeholder}
      />
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading contact info...
      </div>
    );
  }

  const hasContact = contact && Object.values(contact).some((v) => v);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Organiser details card */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-700">Organiser Details</h3>
          <button
            onClick={() => { setEditing(!editing); setForm(contact ?? {}); }}
            className="text-xs text-green-700 hover:text-green-900 border border-green-200 px-2 py-1 rounded hover:bg-green-50"
          >
            {editing ? "Cancel" : "Edit"}
          </button>
        </div>

        {editing ? (
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {field("name", "Name", "Organiser name")}
              {field("organisation", "Organisation", "Club / Association name")}
              {field("email", "Email", "contact@example.com", "email")}
              {field("phone", "Phone", "+44 7700 000000")}
              {field("whatsapp", "WhatsApp", "+44 7700 000000")}
              {field("facebook", "Facebook", "facebook.com/...")}
              {field("instagram", "Instagram", "@handle")}
              {field("twitter", "X / Twitter", "@handle")}
            </div>
            <button
              onClick={saveContact}
              disabled={saving}
              className="w-full flex items-center justify-center gap-1.5 bg-green-700 text-white py-2 rounded-lg text-sm hover:bg-green-600 disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : null}
              {saving ? "Saving..." : "Save Details"}
            </button>
          </div>
        ) : hasContact ? (
          <div className="p-4 space-y-3">
            {contact?.name && (
              <div>
                <p className="text-base font-semibold text-gray-800">{contact.name}</p>
                {contact.organisation && (
                  <p className="text-sm text-gray-500">{contact.organisation}</p>
                )}
              </div>
            )}
            <div className="space-y-2">
              {contact?.email && (
                <a href={`mailto:${contact.email}`} className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                  <Mail className="w-4 h-4 shrink-0" /> {contact.email}
                </a>
              )}
              {contact?.phone && (
                <a href={`tel:${contact.phone}`} className="flex items-center gap-2 text-sm text-gray-700 hover:text-green-700">
                  <Phone className="w-4 h-4 shrink-0" /> {contact.phone}
                </a>
              )}
              {contact?.whatsapp && (
                <a
                  href={`https://wa.me/${contact.whatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-green-600 hover:underline"
                >
                  <MessageCircle className="w-4 h-4 shrink-0" /> WhatsApp
                </a>
              )}
              {contact?.facebook && (
                <a href={contact.facebook} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-700 hover:underline">
                  <Globe className="w-4 h-4 shrink-0" /> Facebook
                </a>
              )}
              {contact?.instagram && (
                <a href={`https://instagram.com/${contact.instagram.replace("@", "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-pink-600 hover:underline">
                  <Globe className="w-4 h-4 shrink-0" /> Instagram {contact.instagram}
                </a>
              )}
              {contact?.twitter && (
                <a href={`https://x.com/${contact.twitter.replace("@", "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-gray-800 hover:underline">
                  <span className="w-4 h-4 flex items-center justify-center font-bold text-xs shrink-0">𝕏</span>
                  {contact.twitter}
                </a>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <Mail className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No organiser details yet.</p>
            <button onClick={() => setEditing(true)} className="text-xs text-green-700 mt-2 hover:underline">
              + Add details
            </button>
          </div>
        )}
      </div>

      {/* General enquiry form */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-700">General Enquiry</h3>
        </div>
        <div className="p-4">
          {enquirySent ? (
            <div className="text-center py-10">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Check className="w-6 h-6 text-green-700" />
              </div>
              <p className="text-gray-700 font-medium">Message sent!</p>
              <p className="text-sm text-gray-400 mt-1">The organiser will be in touch soon.</p>
              <button
                onClick={() => setEnquirySent(false)}
                className="mt-4 text-xs text-green-700 hover:underline"
              >
                Send another
              </button>
            </div>
          ) : (
            <form onSubmit={sendEnquiry} className="space-y-3">
              <div>
                <label className="text-[10px] text-gray-500">Your Name</label>
                <input
                  required
                  value={enquiryName}
                  onChange={(e) => setEnquiryName(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm"
                  placeholder="John Smith"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-500">Email Address</label>
                <input
                  type="email"
                  required
                  value={enquiryEmail}
                  onChange={(e) => setEnquiryEmail(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm"
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-500">Message</label>
                <textarea
                  required
                  value={enquiryMsg}
                  onChange={(e) => setEnquiryMsg(e.target.value)}
                  rows={4}
                  className="w-full border rounded px-3 py-2 text-sm resize-none"
                  placeholder="Write your message here..."
                />
              </div>
              <button
                type="submit"
                disabled={sendingEnquiry}
                className="w-full flex items-center justify-center gap-1.5 bg-green-700 text-white py-2 rounded-lg text-sm hover:bg-green-600 disabled:opacity-60"
              >
                {sendingEnquiry ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                {sendingEnquiry ? "Sending..." : "Send Enquiry"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
