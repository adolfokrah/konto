import { getPayload } from 'payload'
import config from '@payload-config'
import Image from 'next/image'
import ExpandableDescription from '@/components/ExpandableDescription'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {  ShieldCheck } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import Goal from '@/components/Goal'
import ContributionInput from '@/components/ContributionInput'
import RecentContributions from '@/components/RecentContributions'

export default async function Page({ params }: any) {
  const { id: jarId } = await params;
  
  const payload = await getPayload({ config })

  try {
    // Get jar data directly using Payload
    const res = await payload.find({
      collection: 'jars',
      where: {
        id: {
          equals: jarId,
        },
        status: {
          equals: 'open',
        }
      },
      depth: 2, // Include related data like creator
    })

    const jar = res?.docs?.[0];
    
    // Get all contributions for this jar to calculate total
    const allContributions = await payload.find({
      collection: 'contributions',
      where: {
        jar: {
          equals: jarId,
        },
      },
      limit: 1000, // Get all contributions
    })
    
    // Calculate total contributed amount (same logic as jar summary endpoint)
    const totalContributedAmount = allContributions.docs
      .filter(
        contribution =>
          contribution.paymentStatus === 'completed' && contribution.type === 'contribution',
      )
      .reduce((sum, contribution) => sum + (contribution.amountContributed || 0), 0)
    
    // Add balance breakdown to jar object
    const jarWithBalance = {
      ...jar,
      balanceBreakDown: {
        totalContributedAmount: Number(totalContributedAmount.toFixed(2)),
      },
    }
    
    // Get the image URL if it exists
    const imageUrl = jarWithBalance.image && typeof jarWithBalance.image === 'object' ? jarWithBalance.image.url : null
    
    // Get the creator photo URL if it exists
    const creatorPhotoUrl = jarWithBalance?.creator && typeof jarWithBalance.creator === 'object' && jarWithBalance.creator.photo 
      ? (typeof jarWithBalance.creator.photo === 'object' ? jarWithBalance.creator.photo.sizes?.thumbnail?.url : jarWithBalance.creator.photo)
      : null
    
    // Get creator name and initials
    const creatorName = typeof jarWithBalance?.creator === 'object' ? jarWithBalance?.creator?.fullName : jarWithBalance?.creator
    const creatorInitials = creatorName 
      ? creatorName.split(' ').map((name: string) => name.charAt(0)).join('').substring(0, 2).toUpperCase()
      : 'UN' // Unknown if no name
    
    return (
      <div className="min-h-screen bg-white text-black">
        <div className="max-w-2xl mx-auto">
         
          
          {/* Jar Details */}
          <div className="p-6">

             {/* Jar Image - Full Width */}
          {imageUrl && (
            <div className="w-full mb-6">
              <Image
                src={imageUrl}
                alt={jarWithBalance.name || 'Jar image'}
                width={500}
                height={500}
                className="w-full h-80 lg:h-100 object-cover rounded-2xl"
                priority
              />
            </div>
          )}
           <h1 className="font-bold mb-4 truncate sm:text-2xl text-4xl">{jarWithBalance.name}</h1>


        
            
          {jarWithBalance.description && (
            <ExpandableDescription 
              description={jarWithBalance.description}
              className="text-gray-700 mb-4 font-supreme text-base"
            />
          )}
                        <Separator />


           <div className='flex gap-2 mb-4 font-supreme'>
            <Avatar className='w-15 h-15 bg-primary-light'>
              <AvatarImage src={creatorPhotoUrl || undefined} className='object-cover' />
              <AvatarFallback className='bg-primary-light'>{creatorInitials}</AvatarFallback>
            </Avatar>
            <div>
              <div className='leading-tight'>
                  <p className='font-bold text-xl'>{typeof jarWithBalance?.creator === 'object' ? jarWithBalance?.creator?.fullName : jarWithBalance?.creator}</p>
                  <p>Organizer</p>
                  <p>{typeof jarWithBalance?.creator === 'object' ? jarWithBalance?.creator?.country : jarWithBalance?.creator}</p>
              </div>
              <div className='text-xs mt-2 text-green-900 bg-green-100 rounded-lg w-fit px-1.5 py-0.5 flex gap-1'>
                <ShieldCheck className='h-4 w-4' />
                Verified Organizer
              </div>
            </div>
          </div>


          <Separator />

          {/* Goal Section - Show if jar has goal amount and showGoal is enabled */}
          {jarWithBalance.goalAmount && jarWithBalance.goalAmount > 0 && jarWithBalance.paymentPage?.showGoal && (
              <Goal
                currentAmount={jarWithBalance.balanceBreakDown?.totalContributedAmount || 0}
                targetAmount={jarWithBalance.goalAmount}
                deadline={jarWithBalance.deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()}
                currency={jarWithBalance.currency === 'GHS' ? '₵' : '₦'}
                className="my-6"
              />
          )}

          {/* Contribution Input */}
          <ContributionInput
            currency={jarWithBalance.currency}
            isFixedAmount={jarWithBalance.isFixedContribution || false}
            fixedAmount={jarWithBalance.acceptedContributionAmount || 0}
            className="my-6"
            jarId={jarId}
            jarName={jarWithBalance.name}
          />

           <Separator />

          {/* Recent Contributions */}
         { jarWithBalance.paymentPage?.showRecentContributions && (
              <RecentContributions jarId={jarId} limit={5} />
         )}
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error fetching jar:', error)
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center p-8">
          <h1 className="text-title-bold-lg text-red-600 mb-4">Jar Not Found</h1>
          <p className="text-title-regular-m text-gray-600">Could not find jar with ID: {jarId}</p>
        </div>
      </div>
    )
  }
}