<?php

namespace Database\Seeders;

use App\Models\Document;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;

class DummyDocumentsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('Creating dummy documents...');

        // Get a user for the documents (preferably an admin)
        $admin = User::role('admin')->first();
        $userId = $admin ? $admin->id : User::first()->id;

        // Create course-type documents
        $courses = [
            [
                'title' => 'Kỹ thuật lập trình hướng đối tượng',
                'description' => 'Khóa học cung cấp kiến thức nền tảng về lập trình hướng đối tượng (OOP) giúp sinh viên xây dựng ứng dụng hiệu quả.',
                'price' => 0,
                'file_name' => 'oop-course.pdf',
                'thumbnail_path' => 'courses/course1.jpg'
            ],
            [
                'title' => 'Cơ sở dữ liệu nâng cao',
                'description' => 'Tìm hiểu về các kỹ thuật tối ưu hóa cơ sở dữ liệu, indexing và các công cụ phân tích dữ liệu lớn.',
                'price' => 150000,
                'file_name' => 'advanced-db.pdf',
                'thumbnail_path' => 'courses/course2.jpg'
            ],
            [
                'title' => 'Machine Learning cơ bản',
                'description' => 'Khóa học giới thiệu các thuật toán machine learning phổ biến và cách áp dụng vào các bài toán thực tế.',
                'price' => 200000,
                'file_name' => 'ml-basics.pdf',
                'thumbnail_path' => 'courses/course3.jpg'
            ],
            [
                'title' => 'Phát triển ứng dụng Web với Laravel',
                'description' => 'Học cách xây dựng ứng dụng web hoàn chỉnh sử dụng Laravel Framework từ cơ bản đến nâng cao.',
                'price' => 180000,
                'file_name' => 'laravel-dev.pdf',
                'thumbnail_path' => 'courses/course4.jpg'
            ],
        ];

        foreach ($courses as $course) {
            Document::updateOrCreate(
                ['title' => $course['title'], 'type' => 'course'],
                [
                    'user_id' => $userId,
                    'description' => $course['description'],
                    'file_path' => 'documents/samples/' . $course['file_name'],
                    'file_name' => $course['file_name'],
                    'file_type' => 'application/pdf',
                    'file_size' => 1024 * 1024, // 1MB
                    'file_hash' => md5($course['title']),
                    'thumbnail_path' => $course['thumbnail_path'],
                    'is_official' => true,
                    'is_approved' => true,
                    'status' => 'approved',
                    'type' => 'course',
                    'price' => $course['price'],
                    'download_count' => rand(50, 1000),
                    'view_count' => rand(200, 2000),
                ]
            );
        }

        // Create document-type documents
        $documents = [
            [
                'title' => 'Giáo trình Java cơ bản',
                'description' => 'Tài liệu học tập môn lập trình Java',
                'file_name' => 'java-basics.doc',
                'thumbnail_path' => null // Will use default based on extension
            ],
            [
                'title' => 'Bài giảng Mạng máy tính',
                'description' => 'Tổng hợp slide bài giảng môn Mạng máy tính',
                'file_name' => 'networking.pdf',
                'thumbnail_path' => null
            ],
            [
                'title' => 'Đề cương ôn tập Toán rời rạc',
                'description' => 'Tài liệu ôn thi cuối kỳ môn Toán rời rạc',
                'file_name' => 'discrete-math.ppt',
                'thumbnail_path' => null
            ],
            [
                'title' => 'Hướng dẫn sử dụng Git',
                'description' => 'Tài liệu hướng dẫn sử dụng Git từ cơ bản đến nâng cao',
                'file_name' => 'git-guide.txt',
                'thumbnail_path' => null
            ],
            [
                'title' => 'Thiết kế giao diện người dùng',
                'description' => 'Nguyên tắc và hướng dẫn thiết kế UI/UX hiệu quả',
                'file_name' => 'ui-design.xlsx',
                'thumbnail_path' => null
            ],
            [
                'title' => 'Bài tập thực hành Python',
                'description' => 'Tổng hợp bài tập Python từ cơ bản đến nâng cao',
                'file_name' => 'python-exercises.zip',
                'thumbnail_path' => null
            ],
        ];

        foreach ($documents as $document) {
            Document::updateOrCreate(
                ['title' => $document['title'], 'type' => 'document'],
                [
                    'user_id' => $userId,
                    'description' => $document['description'],
                    'file_path' => 'documents/samples/' . $document['file_name'],
                    'file_name' => $document['file_name'],
                    'file_type' => $this->getFileType($document['file_name']),
                    'file_size' => rand(100, 1000) * 1024, // Random size
                    'file_hash' => md5($document['title'] . rand()),
                    'thumbnail_path' => $document['thumbnail_path'],
                    'is_official' => true,
                    'is_approved' => true,
                    'status' => 'approved',
                    'type' => 'document',
                    'price' => 0, // Free documents
                    'download_count' => rand(50, 500),
                    'view_count' => rand(100, 1000),
                ]
            );
        }

        $this->command->info('Dummy documents created successfully.');
    }

    /**
     * Get the MIME type based on file extension
     */
    private function getFileType($filename) {
        $extension = pathinfo($filename, PATHINFO_EXTENSION);
        
        return match(strtolower($extension)) {
            'pdf' => 'application/pdf',
            'doc', 'docx' => 'application/msword',
            'ppt', 'pptx' => 'application/vnd.ms-powerpoint',
            'xls', 'xlsx' => 'application/vnd.ms-excel',
            'zip' => 'application/zip',
            'txt' => 'text/plain',
            default => 'application/octet-stream'
        };
    }
}
