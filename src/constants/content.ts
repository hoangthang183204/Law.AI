export const DISCLAIMER = 'Thông tin mang tính tham khảo, không thay thế việc kiểm tra văn bản pháp luật hiện hành và tư vấn phù hợp với hoàn cảnh cụ thể.'

export interface Suggestion {
  id: string
  title: string
  description: string
  prompt: string
  icon: 'Briefcase' | 'Banknote' | 'Clock' | 'Shield' | 'HeartHandshake' | 'FileText'
}

export const SUGGESTIONS: Suggestion[] = [
  {
    id: 'contract',
    title: 'Hợp đồng lao động',
    description: 'Giao kết, phụ lục, thử việc và các loại hợp đồng.',
    prompt: 'Hợp đồng lao động xác định thời hạn và không xác định thời hạn khác nhau ở những điểm nào?',
    icon: 'Briefcase',
  },
  {
    id: 'wage',
    title: 'Tiền lương',
    description: 'Lương, phụ cấp, thang lương và trả lương.',
    prompt: 'Người sử dụng lao động cần lưu ý những vấn đề gì khi trả lương cho người lao động?',
    icon: 'Banknote',
  },
  {
    id: 'hours',
    title: 'Thời giờ làm việc',
    description: 'Giờ làm, làm thêm, nghỉ phép và nghỉ lễ.',
    prompt: 'Quy định về thời giờ làm việc bình thường và làm thêm giờ cần tìm hiểu những nội dung nào?',
    icon: 'Clock',
  },
  {
    id: 'discipline',
    title: 'Kỷ luật lao động',
    description: 'Nội quy, khiển trách, kéo dài thời hạn nâng lương và sa thải.',
    prompt: 'Xử lý kỷ luật lao động cần đáp ứng những điều kiện và trình tự nào?',
    icon: 'Shield',
  },
  {
    id: 'insurance',
    title: 'Chế độ người lao động',
    description: 'Ốm đau, thai sản, tai nạn lao động và bảo hiểm xã hội.',
    prompt: 'Người lao động cần tìm hiểu những chế độ bảo hiểm xã hội nào khi ốm đau hoặc thai sản?',
    icon: 'HeartHandshake',
  },
  {
    id: 'termination',
    title: 'Chấm dứt hợp đồng',
    description: 'Đơn phương chấm dứt, thôi việc và trợ cấp.',
    prompt: 'Người lao động đơn phương chấm dứt hợp đồng lao động cần lưu ý những vấn đề gì?',
    icon: 'FileText',
  },
]
