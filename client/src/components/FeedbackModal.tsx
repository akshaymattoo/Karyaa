import { MessageCircleQuestionIcon } from 'lucide-react';

interface  FeedbackTabProps {
  onAddItem: (title: string) => void;
}

const FeedbackModal = ({ onAddItem}: FeedbackTabProps) => {
  return (
    <>
        <MessageCircleQuestionIcon /> 
        <div onClick={() => onAddItem("feedback submited ")}>FeedbackModal</div>
    </>
  )
}

export default FeedbackModal