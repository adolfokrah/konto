'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/utilities/ui'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

type FAQ = {
  question: string
  answer: string
}

type Props = {
  disableInnerContainer?: boolean
  heading?: string
  subheading?: string
  faqs?: FAQ[]
  anchor?: string
}

export const FAQBlock: React.FC<Props> = ({
  disableInnerContainer = false,
  heading = 'Your Questions Answered',
  subheading = 'Simple explanations to help you get started with Hoga with confidence',
  faqs = [],
  anchor,
}) => {
  if (!faqs || faqs.length === 0) {
    return null
  }

  return (
    <section id={anchor || undefined} className={cn(' py-20 px-3')}>
      <div className="flex flex-col items-center gap-14">
        {/* Header Section */}
        <div className="flex flex-col items-center gap-[14px] w-full max-w-[612px]">
          {/* Main Heading */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="font-chillax font-bold text-3xl lg:text-5xl leading-[67px] text-black text-center"
          >
            {heading}
          </motion.h2>

          {/* Subheading */}
          {subheading && (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className=" font-medium text-xl  text-black text-center"
            >
              {subheading}
            </motion.p>
          )}
        </div>

        {/* FAQ Accordion */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="w-full max-w-[627px]"
        >
          <Accordion type="single" collapsible className="flex flex-col gap-2">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className=" group border border-black rounded-[25px]"
              >
                <AccordionTrigger className="flex justify-between items-center px-[18px] py-2.5 w-full h-[50px]  hover:no-underline transition-colors duration-200  data-[state=open]:rounded-b-none data-[state=open]:border-b-0 [&>svg]:hidden cursor-pointer pr-2">
                  <span className="font-medium text-md md:text-lg leading-6 text-black text-left flex-1">
                    {faq.question}
                  </span>
                  <div className="flex justify-center items-center w-[30px] h-[30px] border border-black rounded-full ml-2.5">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 18 18"
                      fill="none"
                      className="transition-transform duration-200 group-data-[state=open]:rotate-180"
                    >
                      <path
                        d="M4.5 6.75L9 11.25L13.5 6.75"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-5 py-2.5">
                  <p className=" text-black text-md md:text-lg">{faq.answer}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  )
}
