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
      createdBy: userId ? userId : null,
    }
  } else if (operation === 'update' && userId) {
    return {
      ...data,
      updatedBy: userId ? userId : null,
    }
  }
}
