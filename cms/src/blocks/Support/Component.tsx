import { Phone, MessageCircle, Mail, Clock } from 'lucide-react'

type Props = {
  heading?: string
  subheading?: string
  phoneNumber?: string
  whatsappNumber?: string
  email?: string
  businessHours?: string
  closedDays?: string
}

export const SupportBlock: React.FC<Props> = ({
  heading = 'How can we help?',
  subheading = 'Reach out to us through any of the channels below.',
  phoneNumber,
  whatsappNumber,
  email,
  businessHours = 'Monday - Friday: 9:00 AM - 5:00 PM (GMT)',
  closedDays = 'Saturday - Sunday: Closed',
}) => {
  return (
    <div className="max-w-2xl mx-auto px-6 py-24">
      <div className="text-center mb-10">
        {heading && <h2 className="text-4xl font-bold text-black mb-3">{heading}</h2>}
        {subheading && <p className="text-lg text-gray-500">{subheading}</p>}
      </div>

      <div className="space-y-4">
        {phoneNumber && (
          <a
            href={`tel:${phoneNumber}`}
            className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-gray-200 hover:border-orange-300 transition-colors"
          >
            <div className="flex items-center justify-center w-12 h-12 bg-orange-50 rounded-full">
              <Phone className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="font-medium text-black">Call us</p>
              <p className="text-sm text-gray-500">{phoneNumber}</p>
            </div>
          </a>
        )}

        {whatsappNumber && (
          <a
            href={`https://wa.me/${whatsappNumber.replace('+', '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-gray-200 hover:border-orange-300 transition-colors"
          >
            <div className="flex items-center justify-center w-12 h-12 bg-orange-50 rounded-full">
              <MessageCircle className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="font-medium text-black">WhatsApp</p>
              <p className="text-sm text-gray-500">Chat with us on {whatsappNumber}</p>
            </div>
          </a>
        )}

        {email && (
          <a
            href={`mailto:${email}`}
            className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-gray-200 hover:border-orange-300 transition-colors"
          >
            <div className="flex items-center justify-center w-12 h-12 bg-orange-50 rounded-full">
              <Mail className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="font-medium text-black">Email us</p>
              <p className="text-sm text-gray-500">{email}</p>
            </div>
          </a>
        )}
      </div>

      {(businessHours || closedDays) && (
        <div className="mt-8 p-5 bg-white rounded-2xl border border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <Clock className="w-5 h-5 text-orange-600" />
            <p className="font-medium text-black">Business Hours</p>
          </div>
          <div className="space-y-1 text-sm text-gray-600 ml-8">
            {businessHours && <p>{businessHours}</p>}
            {closedDays && <p>{closedDays}</p>}
          </div>
        </div>
      )}
    </div>
  )
}
