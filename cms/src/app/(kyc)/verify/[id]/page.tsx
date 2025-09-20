import KYCComponent from "@/components/KYCComponent";
import { getPayload } from 'payload'
import config from '@payload-config'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {

   try {
      const { id } = await params

      const payload = await getPayload({ config })

      const user = await payload.findByID({
         collection: 'users',
         id,
      })

      const userData = {
         email: user?.email || ''//optional
      };

     return (
        <KYCComponent userId={id} userData={userData} />
     )
   } catch (error) {
      return <div>Error loading KYC component</div>
   }
}