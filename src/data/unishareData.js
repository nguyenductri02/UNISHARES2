// This file contains mock data for Unishare components
import courseReact from '../assets/course-react.png'; // Assuming you have these images in assets
import courseJs from '../assets/course-js.png';
import courseTs from '../assets/course-ts.png';
import avatarPhamHong from '../assets/teacher-pham-hong.png';
import avatarNguyenB from '../assets/teacher-nguyen-b.png';
import avatarLeC from '../assets/teacher-le-c.png';
import userAvatar from '../assets/avatar-1.png';

export const newCourses = [
  {
    id: 1,
    title: 'Xây dựng Website bằng React JS - 25',
    instructor: 'Thạc sĩ Phạm Hồng',
    instructorAvatar: avatarPhamHong,
    students: 124,
    date: '02/05/2023',
    image: courseReact, 
    description: 'Khóa học giúp bạn xây dựng website chuyên nghiệp với React JS.'
  },
  {
    id: 2,
    title: 'Lập trình JavaScript nâng cao',
    instructor: 'Tiến sĩ Nguyễn Văn B',
    instructorAvatar: avatarNguyenB,
    students: 98,
    date: '15/05/2023',
    image: courseJs,
    description: 'Khóa học JavaScript nâng cao cho các lập trình viên web.'
  },
  {
    id: 3,
    title: 'TypeScript cho người mới bắt đầu',
    instructor: 'Thạc sĩ Lê Thị C',
    instructorAvatar: avatarLeC,
    students: 76,
    date: '20/05/2023',
    image: courseTs,
    description: 'Học TypeScript từ cơ bản đến nâng cao với các ví dụ thực tế.'
  }
];

export const joinedCourses = [
  {
    id: 1,
    title: 'Xây dựng Website React - 1',
    instructor: 'Thạc sĩ Phạm Hồng',
    instructorAvatar: avatarPhamHong,
    members: 54,
    date: '02/05/2023',
    image: courseReact,
    progress: '70%'
  },
  {
    id: 2,
    title: 'CSS Grid và Flexbox',
    instructor: 'Thạc sĩ Trần Đình D',
    instructorAvatar: userAvatar, // Placeholder until you have the actual image
    members: 42,
    date: '10/05/2023',
    image: null, // Will use placeholder
    progress: '45%'
  },
  {
    id: 3,
    title: 'HTML5 và các API mới',
    instructor: 'Thạc sĩ Hoàng Văn E',
    instructorAvatar: userAvatar, // Placeholder until you have the actual image
    members: 38,
    date: '18/05/2023',
    image: null, // Will use placeholder
    progress: '30%'
  }
];

export const announcements = [
  {
    id: 1,
    author: 'Thạc sĩ Phạm Hồng',
    avatar: avatarPhamHong,
    timeAgo: '21 giờ trước',
    content: 'Thông báo ngày 2/5/2023 học React Native, mọi người nhớ chuẩn bị...'
  },
  {
    id: 2,
    author: 'Tiến sĩ Nguyễn Văn B',
    avatar: avatarNguyenB,
    timeAgo: '2 ngày trước',
    content: 'Lớp JavaScript nâng cao sẽ có bài kiểm tra vào tuần tới, các bạn chuẩn bị...'
  },
  {
    id: 3,
    author: 'Thạc sĩ Lê Thị C',
    avatar: avatarLeC,
    timeAgo: '4 ngày trước',
    content: 'Tài liệu TypeScript mới đã được cập nhật lên hệ thống, mời các bạn tải về...'
  }
];

export const myGroups = [
  {
    id: 1,
    title: 'Học React JS cơ bản',
    level: 'cơ bản',
    description: 'Khóa học giúp bạn xây dựng website chuyên nghiệp với ReactJS, làm việc với các thư viện UI và API từ cơ bản đến nâng cao...',
    instructor: 'Thạc sĩ Phạm Hồng',
    instructorAvatar: avatarPhamHong,
    count: '124',
    date: '02/05/2023',
    image: courseReact
  },
  {
    id: 2,
    title: 'Học React JS cơ bản',
    level: 'cơ bản',
    description: 'Lập trình giao diện người dùng với ReactJS, state management, hooks, lifecycle methods và làm việc hiệu quả với các thư viện...',
    instructor: 'Tiến sĩ Nguyễn Văn B',
    instructorAvatar: avatarNguyenB,
    count: '98',
    date: '15/05/2023',
    image: courseReact
  },
  {
    id: 3,
    title: 'Học React JS cơ bản',
    level: 'cơ bản',
    description: 'Học xây dựng ứng dụng web Single Page App với React, Redux, API integration và triển khai dự án thực tế...',
    instructor: 'Thạc sĩ Lê Thị C',
    instructorAvatar: avatarLeC,
    count: '76',
    date: '20/05/2023',
    image: courseReact
  },
  {
    id: 4,
    title: 'Học React JS cơ bản',
    level: 'cơ bản',
    description: 'Làm quen với các khái niệm cơ bản về ReactJS và xây dựng ứng dụng web single-page đơn giản, các component và state...',
    instructor: 'Thạc sĩ Phạm Hồng',
    instructorAvatar: avatarPhamHong,
    count: '130',
    date: '10/06/2023',
    image: courseReact
  },
];
