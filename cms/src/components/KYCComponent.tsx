"use client"
import dynamic from 'next/dynamic'

// Dynamically import Dojah to avoid SSR issues
const Dojah = dynamic(() => import('react-dojah'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center p-8">Loading KYC widget...</div>
})

const appID = process.env.NEXT_PUBLIC_DOJAH_APP_ID!;
const publicKey = process.env.NEXT_PUBLIC_DOJAH_PUBLIC_KEY!;
const config = {
    widget_id: process.env.NEXT_PUBLIC_DOJAH_WIDGET_ID! //this is generated from easyonboard here https://app.dojah.io/easy-onboard
};
const type = "custom";

export default function KYCComponent({ userId, userData }: { userId: string, userData: {
    first_name?: string;
    last_name?: string;
    dob?: string;
    residence_country?: string;
    email?: string;
} }) {

      const response = (type: string, data: any) => {
        if(type === 'success'){
            fetch('/api/users/update-kyc', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId,
                }),
            })
            .then((res) => res.json())
            .then((data) => {
                if(data.success){
                    alert('KYC verification successful!, restart the app to access your account');
                    window.location.href = '/'; //redirect to dashboard or any other page
                }else{
                    alert('KYC verification failed: ' + data.message);
                }
            })
            .catch((err) => {
                throw new Error(err);
            });
        }else if(type === 'error'){
            console.log(data, 'verification failed');
        }else if(type === 'close'){

        }else if(type === 'begin'){

        }else if(type === 'loading'){

        }
    }


    /**
     *  These are the metadata options
     *  You can pass any values within the object
     */
    const metadata = {userId};
 

    return (
        <div>
        <Dojah
            response={response}
            appID={appID}
            publicKey={publicKey}
            type={type}
            config={config}
            userData={userData}
            metadata={metadata}
            />
        </div>
    )
}