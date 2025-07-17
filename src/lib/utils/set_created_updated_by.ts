export const seteCreatedUpdatedBy = ({
  data,
  operation,
  userId,
}: {
  data: any
  operation: 'create' | 'update'
  userId?: string | null
}) => {
  if (operation === 'create' && userId) {
    return {
      ...data,
      createdBy: userId,
      updatedBy: userId, // Set updatedBy for create as well
    }
  } else if (operation === 'update' && userId) {
    return {
      ...data,
      updatedBy: userId,
    }
  }

  // Return data unchanged if no userId or conditions not met
  return data
}
