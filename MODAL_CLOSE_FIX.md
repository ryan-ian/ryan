# Modal Close Functionality Fix

## Problem

The modals in the application were not closing properly when users clicked on the close button (X) or when they clicked outside the modal. This issue affected both the `BookingCreationModal` and `BookingDetailsModal` components.

## Solution

We implemented the following fixes:

### 1. Fixed the Dialog `onOpenChange` Handler

The Dialog component from shadcn/ui uses a prop called `onOpenChange` that is triggered when the dialog's open state changes. We updated this handler to properly call the `onClose` function provided by the parent component:

```tsx
// Before
<Dialog open={isOpen} onOpenChange={(open) => {
  if (!open) resetAndClose()
}}>

// After
<Dialog open={isOpen} onOpenChange={(open) => {
  if (!open) {
    resetAndClose()
    onClose()
  }
}}>
```

### 2. Added Explicit Close Button in Dialog Header

We added an explicit close button in the header of both modals using the `DialogClose` component from shadcn/ui:

```tsx
<DialogHeader>
  <div className="flex items-center justify-between">
    <DialogTitle>Book {room.name}</DialogTitle>
    <DialogClose className="h-6 w-6 rounded-md opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer">
      <X className="h-4 w-4" />
      <span className="sr-only">Close</span>
    </DialogClose>
  </div>
  <DialogDescription>
    {/* ... */}
  </DialogDescription>
</DialogHeader>
```

### 3. Updated the Cancel Button in Dialog Footer

We updated the Cancel button in the `BookingCreationModal` to call both `resetAndClose` and `onClose`:

```tsx
// Before
<Button type="button" variant="outline" onClick={resetAndClose}>
  Cancel
</Button>

// After
<Button type="button" variant="outline" onClick={() => {
  resetAndClose();
  onClose();
}}>
  Cancel
</Button>
```

### 4. Fixed the BookingDetailsModal Close Functionality

We applied similar changes to the `BookingDetailsModal` component:

```tsx
// Before
<Dialog open={isOpen} onOpenChange={onClose}>

// After
<Dialog open={isOpen} onOpenChange={(open) => {
  if (!open) onClose();
}}>
```

And added the close button in the header:

```tsx
<div className="flex items-center justify-between">
  <DialogTitle className="flex items-center gap-2">
    <span>{currentBooking.title || "Meeting"}</span>
    <Badge className={getStatusColor(currentBooking.status)}>
      {currentBooking.status}
    </Badge>
  </DialogTitle>
  <DialogClose className="h-6 w-6 rounded-md opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer">
    <X className="h-4 w-4" />
    <span className="sr-only">Close</span>
  </DialogClose>
</div>
```

## Benefits of the Fix

1. **Improved User Experience**: Users can now close modals using the close button (X), by clicking outside the modal, or by using the Cancel button.

2. **Consistent Behavior**: Both modals now have consistent closing behavior.

3. **Proper State Management**: The modals properly reset their state when closed, preventing stale data from persisting.

4. **Accessibility**: The close button is now properly labeled with a screen reader-only text, improving accessibility.

These changes ensure that users can easily close modals in the application, providing a better user experience and preventing potential frustration. 