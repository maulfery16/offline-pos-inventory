// Re-export shadcn dialog as Modal for backward compatibility
export {
  Dialog as Modal,
  DialogContent as ModalContent,
  DialogHeader as ModalHeader,
  DialogFooter as ModalFooter,
  DialogTitle as ModalTitle,
  DialogDescription as ModalDescription,
  DialogTrigger as ModalTrigger,
} from './ui/dialog';

// For controlled modal usage, wrap in Dialog component:
// <Modal open={isOpen} onOpenChange={(open) => !open && onClose()}>
//   <ModalContent>
//     <ModalHeader>
//       <ModalTitle>Title</ModalTitle>
//       <ModalDescription>Description</ModalDescription>
//     </ModalHeader>
//     {children}
//     <ModalFooter>
//       <Button onClick={onClose}>Close</Button>
//     </ModalFooter>
//   </ModalContent>
// </Modal>
