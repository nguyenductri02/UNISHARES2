<?php

namespace App\Http\Controllers\API\Home;

use App\Http\Controllers\Controller;
use App\Http\Resources\DocumentResource;
use App\Http\Resources\PostResource;
use App\Models\Document;
use App\Models\Group;
use App\Models\Post;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class HomeController extends Controller
{
    /**
     * Get popular courses for the homepage
     */
    public function getPopularCourses(Request $request)
    {
        try {
            // Query groups with type 'course' and order by member_count
            $courses = Group::where('type', 'course')
                ->orderBy('member_count', 'desc')
                ->take(4)
                ->get();

            // If no courses found, return dummy data
            if ($courses->isEmpty()) {
                return response()->json([
                    'success' => true,
                    'data' => $this->getDummyCourses(),
                ]);
            }

            return response()->json([
                'success' => true,
                'data' => $courses->map(function ($course) {
                    return [
                        'id' => $course->id,
                        'title' => $course->name,
                        'description' => $course->description ?? substr($course->name, 0, 100),
                        'thumbnail' => $course->cover_image ? url('storage/' . $course->cover_image) : url('storage/courses/course' . ($course->id % 4 + 1) . '.jpg'),                        'member_count' => $course->member_count ?? 0,
                        'course_code' => $course->course_code,
                    ];
                }),
            ]);
        } catch (\Exception $e) {
            Log::error('Error in getPopularCourses: ' . $e->getMessage());
            return response()->json([
                'success' => true,
                'data' => $this->getDummyCourses(),
            ]);
        }
    }

    /**
     * Get free documents for the homepage
     */
    public function getFreeDocuments(Request $request)
    {
        try {
            Log::info('Fetching free documents for homepage');
            
            // First try to get any documents from the database, with less strict filters
            $documents = Document::where(function($query) {
                    $query->where('status', 'approved')
                         ->orWhere('is_approved', true);
                })
                ->orderBy('download_count', 'desc')
                ->take(6)
                ->get();
            
            Log::info('Initial document query returned: ' . $documents->count() . ' documents');
                
            // If we have no documents at all, try an even less strict query
            if ($documents->isEmpty()) {
                $documents = Document::orderBy('created_at', 'desc')
                    ->take(6)
                    ->get();
                    
                Log::info('Fallback document query returned: ' . $documents->count() . ' documents');
            }

            // Ensure we have data to show
            if ($documents->isEmpty()) {
                // Create document icons if missing for the dummy data
                $this->ensureDirectoriesExist();
                $this->createDummyImagesIfMissing('documents', [
                    'doc.png', 'pdf.png', 'ppt.png', 'txt.png', 'xls.png', 'zip.png'
                ]);
                
                Log::warning('No documents found in database, returning dummy data');
                // Return dummy documents as a last resort
                return response()->json([
                    'success' => true,
                    'data' => $this->getDummyDocuments(),
                ]);
            }

            Log::info('Successfully retrieved ' . $documents->count() . ' documents from the database');
            
            // Map the document data for the response
            $documentData = $documents->map(function ($document) {
                return [
                    'id' => $document->id,
                    'title' => $document->title ?? 'Untitled Document',
                    'description' => $document->description ?? 'No description available',
                    'thumbnail' => $document->thumbnail_url, // Using the accessor
                    'downloads' => $document->download_count ?? 0,
                    'file_type' => $document->file_type ?? 'unknown',
                    'course_code' => $document->course_code,
                    'subject' => $document->subject,
                    'view_count' => $document->view_count ?? 0,
                    'average_rating' => $document->getAverageRatingAttribute() ?? 0,
                    'is_official' => $document->is_official ?? false,
                    'created_at' => $document->created_at->format('Y-m-d H:i:s'),
                    'updated_at' => $document->updated_at->format('Y-m-d H:i:s'),
                    'download_url' => url('/api/documents/'.$document->id.'/download'),
                    'view_url' => url('/api/documents/'.$document->id.'/view'),
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $documentData,
            ]);
        } catch (\Exception $e) {
            Log::error('Error in getFreeDocuments: ' . $e->getMessage());
            Log::error($e->getTraceAsString());
            
            // Return dummy documents in case of error
            return response()->json([
                'success' => true,
                'data' => $this->getDummyDocuments(),
            ]);
        }
    }    /**
     * Get recent blog posts for the homepage
     */
    public function getRecentPosts(Request $request)
    {
        try {
            $posts = Post::where('status', 'published')
                ->orderBy('created_at', 'desc')
                ->take(4)
                ->get();

            // If no posts found, return dummy data
            if ($posts->isEmpty()) {
                return response()->json([
                    'success' => true,
                    'data' => $this->getDummyPosts(),
                ]);
            }

            return response()->json([
                'success' => true,
                'data' => $posts->map(function ($post) {
                    return [
                        'id' => $post->id,
                        'title' => $post->title,
                        'content' => $post->content,
                        'excerpt' => substr(strip_tags($post->content), 0, 120) . '...',
                        'thumbnail' => $post->thumbnail ? url('storage/' . $post->thumbnail) : null,
                        'created_at' => $post->created_at,
                        'author' => [
                            'id' => $post->user->id ?? 1,
                            'name' => $post->user->name ?? 'UNISHARE User',
                        ],
                    ];
                }),
            ]);
        } catch (\Exception $e) {
            Log::error('Error in getRecentPosts: ' . $e->getMessage());
            return response()->json([
                'success' => true,
                'data' => $this->getDummyPosts(),
            ]);
        }
    }

    /**
     * Get platform statistics for the homepage
     */
    public function getStats(Request $request)
    {
        try {
            $userCount = User::count();
            $courseCount = Document::where('type', 'course')->count();
            $documentCount = Document::count();
            $completionCount = DB::table('document_user')
                ->where('status', 'completed')
                ->count();

            // If counts are too low for a good demo, use minimum values
            $stats = [
                'users' => max($userCount, 1000),
                'courses' => max($courseCount, 120),
                'documents' => max($documentCount, 3500),
                'completions' => max($completionCount, 12500),
            ];

            return response()->json([
                'success' => true,
                'data' => $stats,
            ]);
        } catch (\Exception $e) {
            Log::error('Error in getStats: ' . $e->getMessage());
            return response()->json([
                'success' => true,
                'data' => [
                    'users' => 1000,
                    'courses' => 120,
                    'documents' => 3500,
                    'completions' => 12500,
                ]
            ]);
        }
    }

    /**
     * Get popular study groups for the homepage
     */
    public function getStudyGroups(Request $request)
    {
        try {
            // Query groups that are not of type 'course' and order by member_count
            $studyGroups = Group::whereNotIn('type', ['course'])
                ->orderBy('member_count', 'desc')
                ->take(4)
                ->get();

            // If no study groups found, return dummy data
            if ($studyGroups->isEmpty()) {
                return response()->json([
                    'success' => true,
                    'data' => $this->getDummyStudyGroups(),
                ]);
            }

            return response()->json([
                'success' => true,
                'data' => $studyGroups->map(function ($group) {
                    return [
                        'id' => $group->id,
                        'title' => $group->name,
                        'description' => $group->description ?? substr($group->name, 0, 100),
                        'thumbnail' => $group->cover_image ? url('storage/' . $group->cover_image) : url('storage/courses/course' . ($group->id % 4 + 1) . '.jpg'),
                        'type' => $group->type,
                        'member_count' => $group->member_count ?? 0,
                    ];
                }),
            ]);
        } catch (\Exception $e) {
            Log::error('Error in getStudyGroups: ' . $e->getMessage());
            return response()->json([
                'success' => true,
                'data' => $this->getDummyStudyGroups(),
            ]);
        }
    }

    /**
     * Get popular documents
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getPopularDocuments(Request $request)
    {
        try {
            $limit = $request->input('per_page', 12);
            $page = $request->input('page', 1);
            $offset = ($page - 1) * $limit;
            
            // Filter by subject if provided
            $query = Document::query();
            
            if ($request->has('subject') && !empty($request->subject)) {
                $query->where('subject', $request->subject);
            }
            
            // Add search filter if provided
            if ($request->has('search') && !empty($request->search)) {
                $searchTerm = $request->search;
                $query->where(function($q) use ($searchTerm) {
                    $q->where('title', 'like', "%{$searchTerm}%")
                      ->orWhere('description', 'like', "%{$searchTerm}%")
                      ->orWhere('course_code', 'like', "%{$searchTerm}%");
                });
            }
            
            // Only show approved documents to regular users
            $query->where(function($q) {
                $q->where('status', 'approved')
                  ->orWhere('is_approved', true);
            });
            
            // Order by download count for popular documents
            $query->orderBy('download_count', 'desc');
            
            // Get total count before pagination
            $total = $query->count();
            
            // Apply pagination
            $documents = $query->skip($offset)->take($limit)->get();
            
            // If no documents found, return dummy data
            if ($documents->isEmpty() && $page == 1) {
                return response()->json([
                    'success' => true,
                    'data' => $this->getDummyDocuments(),
                    'meta' => [
                        'current_page' => 1,
                        'last_page' => 1,
                        'per_page' => $limit,
                        'total' => count($this->getDummyDocuments())
                    ]
                ]);
            }
            
            // Map documents to resources
            $documentData = $documents->map(function ($document) {
                return [
                    'id' => $document->id,
                    'title' => $document->title ?? 'Untitled Document',
                    'description' => $document->description ?? 'No description available',
                    'thumbnail' => $document->thumbnail_url,
                    'downloads' => $document->download_count ?? 0,
                    'file_type' => $document->file_type ?? 'unknown',
                    'course_code' => $document->course_code,
                    'subject' => $document->subject,
                    'view_count' => $document->view_count ?? 0,
                    'download_count' => $document->download_count ?? 0,
                    'average_rating' => $document->getAverageRatingAttribute() ?? 0,
                    'is_official' => $document->is_official ?? false,
                    'created_at' => $document->created_at->format('Y-m-d H:i:s'),
                    'updated_at' => $document->updated_at->format('Y-m-d H:i:s'),
                    'download_url' => url('/api/documents/'.$document->id.'/download'),
                    'view_url' => url('/api/documents/'.$document->id.'/view'),
                    'author' => $document->user ? $document->user->name : 'Unknown Author',
                ];
            });
            
            return response()->json([
                'success' => true,
                'data' => $documentData,
                'meta' => [
                    'current_page' => (int)$page,
                    'last_page' => ceil($total / $limit),
                    'per_page' => (int)$limit,
                    'total' => $total
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error in getPopularDocuments: ' . $e->getMessage());
            Log::error($e->getTraceAsString());
            
            return response()->json([
                'success' => true,
                'data' => $this->getDummyDocuments(),
                'meta' => [
                    'current_page' => 1,
                    'last_page' => 1,
                    'per_page' => 12,
                    'total' => count($this->getDummyDocuments())
                ]
            ]);
        }
    }

    /**
     * Get new documents
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getNewDocuments(Request $request)
    {
        try {
            $limit = $request->input('per_page', 12);
            $page = $request->input('page', 1);
            $offset = ($page - 1) * $limit;
            
            // Filter by subject if provided
            $query = Document::query();
            
            if ($request->has('subject') && !empty($request->subject)) {
                $query->where('subject', $request->subject);
            }
            
            // Add search filter if provided
            if ($request->has('search') && !empty($request->search)) {
                $searchTerm = $request->search;
                $query->where(function($q) use ($searchTerm) {
                    $q->where('title', 'like', "%{$searchTerm}%")
                      ->orWhere('description', 'like', "%{$searchTerm}%")
                      ->orWhere('course_code', 'like', "%{$searchTerm}%");
                });
            }
            
            // Only show approved documents to regular users
            $query->where(function($q) {
                $q->where('status', 'approved')
                  ->orWhere('is_approved', true);
            });
            
            // Order by created_at date for new documents
            $query->orderBy('created_at', 'desc');
            
            // Get total count before pagination
            $total = $query->count();
            
            // Apply pagination
            $documents = $query->skip($offset)->take($limit)->get();
            
            // If no documents found, return dummy data
            if ($documents->isEmpty() && $page == 1) {
                return response()->json([
                    'success' => true,
                    'data' => $this->getDummyDocuments(),
                    'meta' => [
                        'current_page' => 1,
                        'last_page' => 1,
                        'per_page' => $limit,
                        'total' => count($this->getDummyDocuments())
                    ]
                ]);
            }
            
            // Map documents to resources
            $documentData = $documents->map(function ($document) {
                return [
                    'id' => $document->id,
                    'title' => $document->title ?? 'Untitled Document',
                    'description' => $document->description ?? 'No description available',
                    'thumbnail' => $document->thumbnail_url,
                    'downloads' => $document->download_count ?? 0,
                    'file_type' => $document->file_type ?? 'unknown',
                    'course_code' => $document->course_code,
                    'subject' => $document->subject,
                    'view_count' => $document->view_count ?? 0,
                    'download_count' => $document->download_count ?? 0,
                    'average_rating' => $document->getAverageRatingAttribute() ?? 0,
                    'is_official' => $document->is_official ?? false,
                    'created_at' => $document->created_at->format('Y-m-d H:i:s'),
                    'updated_at' => $document->updated_at->format('Y-m-d H:i:s'),
                    'download_url' => url('/api/documents/'.$document->id.'/download'),
                    'view_url' => url('/api/documents/'.$document->id.'/view'),
                    'author' => $document->user ? $document->user->name : 'Unknown Author',
                ];
            });
            
            return response()->json([
                'success' => true,
                'data' => $documentData,
                'meta' => [
                    'current_page' => (int)$page,
                    'last_page' => ceil($total / $limit),
                    'per_page' => (int)$limit,
                    'total' => $total
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error in getNewDocuments: ' . $e->getMessage());
            Log::error($e->getTraceAsString());
            
            return response()->json([
                'success' => true,
                'data' => $this->getDummyDocuments(),
                'meta' => [
                    'current_page' => 1,
                    'last_page' => 1,
                    'per_page' => 12,
                    'total' => count($this->getDummyDocuments())
                ]
            ]);
        }
    }

    /**
     * Get all documents
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getAllDocuments(Request $request)
    {
        try {
            $limit = $request->input('per_page', 12);
            $page = $request->input('page', 1);
            $offset = ($page - 1) * $limit;
            
            // Filter by subject if provided
            $query = Document::query();
            
            if ($request->has('subject') && !empty($request->subject)) {
                $query->where('subject', $request->subject);
            }
            
            // Add search filter if provided
            if ($request->has('search') && !empty($request->search)) {
                $searchTerm = $request->search;
                $query->where(function($q) use ($searchTerm) {
                    $q->where('title', 'like', "%{$searchTerm}%")
                      ->orWhere('description', 'like', "%{$searchTerm}%")
                      ->orWhere('course_code', 'like', "%{$searchTerm}%");
                });
            }
            
            // Only show approved documents to regular users
            $query->where(function($q) {
                $q->where('status', 'approved')
                  ->orWhere('is_approved', true);
            });
            
            // Sort documents based on sort parameter
            if ($request->has('sortBy')) {
                $sortField = $request->sortBy;
                $sortDirection = $request->input('sortDirection', 'desc');
                
                switch ($sortField) {
                    case 'latest':
                        $query->orderBy('created_at', $sortDirection);
                        break;
                    case 'downloads':
                        $query->orderBy('download_count', $sortDirection);
                        break;
                    case 'views':
                        $query->orderBy('view_count', $sortDirection);
                        break;
                    case 'title':
                        $query->orderBy('title', $sortDirection);
                        break;
                    default:
                        $query->orderBy('created_at', 'desc');
                }
            } else {
                $query->orderBy('created_at', 'desc');
            }
            
            // Get total count before pagination
            $total = $query->count();
            
            // Apply pagination
            $documents = $query->skip($offset)->take($limit)->get();
            
            // If no documents found, return dummy data
            if ($documents->isEmpty() && $page == 1) {
                return response()->json([
                    'success' => true,
                    'data' => $this->getDummyDocuments(),
                    'meta' => [
                        'current_page' => 1,
                        'last_page' => 1,
                        'per_page' => $limit,
                        'total' => count($this->getDummyDocuments())
                    ]
                ]);
            }
            
            // Map documents to resources
            $documentData = $documents->map(function ($document) {
                return [
                    'id' => $document->id,
                    'title' => $document->title ?? 'Untitled Document',
                    'description' => $document->description ?? 'No description available',
                    'thumbnail' => $document->thumbnail_url,
                    'downloads' => $document->download_count ?? 0,
                    'file_type' => $document->file_type ?? 'unknown',
                    'course_code' => $document->course_code,
                    'subject' => $document->subject,
                    'view_count' => $document->view_count ?? 0,
                    'download_count' => $document->download_count ?? 0,
                    'average_rating' => $document->getAverageRatingAttribute() ?? 0,
                    'is_official' => $document->is_official ?? false,
                    'created_at' => $document->created_at->format('Y-m-d H:i:s'),
                    'updated_at' => $document->updated_at->format('Y-m-d H:i:s'),
                    'download_url' => url('/api/documents/'.$document->id.'/download'),
                    'view_url' => url('/api/documents/'.$document->id.'/view'),
                    'author' => $document->user ? $document->user->name : 'Unknown Author',
                ];
            });
            
            return response()->json([
                'success' => true,
                'data' => $documentData,
                'meta' => [
                    'current_page' => (int)$page,
                    'last_page' => ceil($total / $limit),
                    'per_page' => (int)$limit,
                    'total' => $total
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error in getAllDocuments: ' . $e->getMessage());
            Log::error($e->getTraceAsString());
            
            return response()->json([
                'success' => true,
                'data' => $this->getDummyDocuments(),
                'meta' => [
                    'current_page' => 1,
                    'last_page' => 1,
                    'per_page' => 12,
                    'total' => count($this->getDummyDocuments())
                ]
            ]);
        }
    }

    /**
     * Generate dummy courses data
     */
    private function getDummyCourses()
    {
        // Make sure directories exist before returning URLs
        $this->ensureDirectoriesExist();

        // Create dummy images if needed
        $this->createDummyImagesIfMissing('courses', [
            'course1.jpg', 'course2.jpg', 'course3.jpg', 'course4.jpg'
        ]);
        
        return [
            [
                'id' => 1,
                'title' => 'Kỹ thuật lập trình hướng đối tượng',
                'description' => 'Khóa học cung cấp kiến thức nền tảng về lập trình hướng đối tượng (OOP) giúp sinh viên xây dựng ứng dụng hiệu quả.',
                'thumbnail' => url('storage/courses/course1.jpg'),
                'price' => 0,
                'downloads' => 1245,
                'ratings' => 4.8,
            ],
            [
                'id' => 2,
                'title' => 'Cơ sở dữ liệu nâng cao',
                'description' => 'Tìm hiểu về các kỹ thuật tối ưu hóa cơ sở dữ liệu, indexing và các công cụ phân tích dữ liệu lớn.',
                'thumbnail' => url('storage/courses/course2.jpg'),
                'price' => 150000,
                'downloads' => 892,
                'ratings' => 4.6,
            ],
            [
                'id' => 3,
                'title' => 'Machine Learning cơ bản',
                'description' => 'Khóa học giới thiệu các thuật toán machine learning phổ biến và cách áp dụng vào các bài toán thực tế.',
                'thumbnail' => url('storage/courses/course3.jpg'),                'price' => 200000,
                'downloads' => 756,
                'ratings' => 4.7,
            ],
            [
                'id' => 4,
                'title' => 'Phát triển ứng dụng Web với Laravel',
                'description' => 'Học cách xây dựng ứng dụng web hoàn chỉnh sử dụng Laravel Framework từ cơ bản đến nâng cao.',
                'thumbnail' => url('storage/courses/course4.jpg'),
                'price' => 180000,
                'downloads' => 689,
                'ratings' => 4.9,
            ],
        ];
    }

    /**
     * Generate dummy study groups data
     */
    private function getDummyStudyGroups()
    {
        // Make sure directories exist before returning URLs
        $this->ensureDirectoriesExist();

        // Create dummy images if needed
        $this->createDummyImagesIfMissing('courses', [
            'course1.jpg', 'course2.jpg', 'course3.jpg', 'course4.jpg'
        ]);
        
        return [
            [
                'id' => 10,
                'title' => 'Nhóm học Toán cao cấp',
                'description' => 'Nhóm học tập và trao đổi về các chủ đề Toán cao cấp cho sinh viên năm nhất và năm hai.',
                'thumbnail' => url('storage/courses/course1.jpg'),
                'type' => 'university',
                'member_count' => 42,
            ],
            [
                'id' => 11,
                'title' => 'CLB Vật lý',
                'description' => 'Câu lạc bộ dành cho những người yêu thích Vật lý. Thảo luận về các chủ đề từ cơ bản đến nâng cao.',
                'thumbnail' => url('storage/courses/course2.jpg'),
                'type' => 'interest',
                'member_count' => 35,
            ],
            [
                'id' => 12,
                'title' => 'Nhóm nghiên cứu Khoa học máy tính',
                'description' => 'Nhóm nghiên cứu và trao đổi về các chủ đề Khoa học máy tính từ thuật toán đến AI.',
                'thumbnail' => url('storage/courses/course3.jpg'),
                'type' => 'university',
                'member_count' => 28,
            ],
            [
                'id' => 13,
                'title' => 'Nhóm ôn thi Tiếng Anh',
                'description' => 'Nhóm hỗ trợ học tập và ôn thi các chứng chỉ Tiếng Anh như TOEIC, IELTS, và TOEFL.',
                'thumbnail' => url('storage/courses/course4.jpg'),
                'type' => 'interest',
                'member_count' => 53,
            ],
        ];
    }

    /**
     * Generate dummy documents data
     */
    private function getDummyDocuments()
    {
        // Make sure directories exist before returning URLs
        $this->ensureDirectoriesExist();

        // Create dummy document icons if needed
        $this->createDummyImagesIfMissing('documents', [
            'doc.png', 'pdf.png', 'ppt.png', 'txt.png', 'xls.png', 'zip.png'
        ]);
        
        return [
            [
                'id' => 101,
                'title' => 'Giáo trình Java cơ bản',
                'description' => 'Tài liệu học tập môn lập trình Java',
                'thumbnail' => url('storage/documents/doc.png'),
                'downloads' => 3456,
            ],
            [
                'id' => 102,                'title' => 'Bài giảng Mạng máy tính',
                'description' => 'Tổng hợp slide bài giảng môn Mạng máy tính',
                'thumbnail' => url('storage/documents/pdf.png'),
                'downloads' => 2987,
            ],
            [
                'id' => 103,
                'title' => 'Đề cương ôn tập Toán rời rạc',                'description' => 'Tài liệu ôn thi cuối kỳ môn Toán rời rạc',
                'thumbnail' => url('storage/documents/ppt.png'),
                'downloads' => 2543,
            ],
            [
                'id' => 104,
                'title' => 'Hướng dẫn sử dụng Git',
                'description' => 'Tài liệu hướng dẫn sử dụng Git từ cơ bản đến nâng cao',
                'thumbnail' => url('storage/documents/txt.png'),
                'downloads' => 1876,
            ],
            [
                'id' => 105,
                'title' => 'Thiết kế giao diện người dùng',
                'description' => 'Nguyên tắc và hướng dẫn thiết kế UI/UX hiệu quả',
                'thumbnail' => url('storage/documents/xls.png'),
                'downloads' => 1654,
            ],
            [
                'id' => 106,
                'title' => 'Bài tập thực hành Python',
                'description' => 'Tổng hợp bài tập Python từ cơ bản đến nâng cao',
                'thumbnail' => url('storage/documents/zip.png'),
                'downloads' => 1432,
            ],
        ];
    }

    /**
     * Generate dummy blog posts data
     */
    private function getDummyPosts()
    {
        // Make sure directories exist before returning URLs
        $this->ensureDirectoriesExist();

        // Create dummy blog images if needed
        $this->createDummyImagesIfMissing('blog', [
            'post1.jpg', 'post2.jpg', 'post3.jpg', 'post4.jpg'
        ]);
        
        return [
            [
                'id' => 201,
                'title' => 'Các xu hướng công nghệ 2023',
                'content' => '<p>Năm 2023 chứng kiến sự bùng nổ của các công nghệ AI và Machine Learning. Các mô hình ngôn ngữ lớn như GPT-4 đã tạo ra bước tiến đáng kể trong khả năng hiểu và tạo ra nội dung gần với con người.</p><p>Ngoài ra, việc áp dụng blockchain vào các lĩnh vực ngoài tiền điện tử cũng đang ngày càng phổ biến, đặc biệt là trong chuỗi cung ứng và quản lý danh tính.</p>',
                'excerpt' => 'Năm 2023 chứng kiến sự bùng nổ của các công nghệ AI và Machine Learning. Các mô hình ngôn ngữ lớn như GPT-4...',
                'thumbnail' => url('storage/blog/post1.jpg'),
                'created_at' => '2023-10-15T08:30:00',
                'author' => [
                    'id' => 1,
                    'name' => 'Nguyễn Văn Tech',
                ],
            ],
            [
                'id' => 202,
                'title' => 'Hướng dẫn tự học lập trình hiệu quả',
                'content' => '<p>Để tự học lập trình hiệu quả, bạn cần xây dựng một lộ trình học tập rõ ràng và kiên trì thực hiện. Bắt đầu với các ngôn ngữ cơ bản như HTML, CSS và JavaScript trước khi tiến tới các framework phức tạp hơn.</p><p>Việc thực hành thường xuyên thông qua các dự án thực tế là cách tốt nhất để củng cố kiến thức. Hãy tham gia các cộng đồng lập trình để học hỏi từ người khác và nhận được sự hỗ trợ khi cần thiết.</p>',
                'excerpt' => 'Để tự học lập trình hiệu quả, bạn cần xây dựng một lộ trình học tập rõ ràng và kiên trì thực hiện...',
                'thumbnail' => url('storage/blog/post2.jpg'),
                'created_at' => '2023-09-28T10:15:00',
                'author' => [
                    'id' => 2,
                    'name' => 'Trần Thị Coder',
                ],
            ],
            [
                'id' => 203,
                'title' => 'Top 5 ngôn ngữ lập trình được yêu cầu nhiều nhất',
                'content' => '<p>Theo khảo sát mới nhất, Python tiếp tục dẫn đầu danh sách các ngôn ngữ lập trình được yêu cầu nhiều nhất trong các tin tuyển dụng IT. Tiếp theo là JavaScript, Java, C# và TypeScript.</p><p>Sự phổ biến của Python được thúc đẩy bởi sự đơn giản trong cú pháp và tính linh hoạt, cũng như ứng dụng rộng rãi trong các lĩnh vực đang phát triển như AI, data science và machine learning.</p>',
                'excerpt' => 'Theo khảo sát mới nhất, Python tiếp tục dẫn đầu danh sách các ngôn ngữ lập trình được yêu cầu nhiều nhất...',
                'thumbnail' => url('storage/blog/post3.jpg'),
                'created_at' => '2023-09-12T14:45:00',
                'author' => [
                    'id' => 3,
                    'name' => 'Lê Anh Developer',
                ],
            ],
            [
                'id' => 204,
                'title' => 'Cách chuẩn bị cho phỏng vấn lập trình viên',
                'content' => '<p>Phỏng vấn lập trình viên thường bao gồm các câu hỏi kỹ thuật, bài tập coding và thảo luận về dự án. Để chuẩn bị tốt, hãy ôn tập các cấu trúc dữ liệu và thuật toán cơ bản, luyện giải các bài toán trên các nền tảng như LeetCode hay HackerRank.</p><p>Ngoài ra, hãy chuẩn bị để trình bày về các dự án bạn đã làm, những thách thức bạn đã gặp và cách bạn đã giải quyết chúng. Việc hiểu rõ về công ty và vị trí ứng tuyển cũng rất quan trọng.</p>',
                'excerpt' => 'Phỏng vấn lập trình viên thường bao gồm các câu hỏi kỹ thuật, bài tập coding và thảo luận về dự án...',
                'thumbnail' => url('storage/blog/post4.jpg'),
                'created_at' => '2023-08-25T09:30:00',
                'author' => [
                    'id' => 4,
                    'name' => 'Phạm Thị HR',
                ],
            ],
        ];
    }
      /**
     * Ensure all required directories exist
     */
    private function ensureDirectoriesExist()
    {
        $directories = [
            'blog', 
            'courses', 
            'documents'
        ];
        
        foreach ($directories as $dir) {
            if (!Storage::disk('public')->exists($dir)) {
                Storage::disk('public')->makeDirectory($dir);
            }
        }
    }

    /**
     * Create dummy images if they don't exist
     */
    private function createDummyImagesIfMissing($directory, $filenames)
    {
        foreach ($filenames as $filename) {
            $filePath = $directory . '/' . $filename;
            
            if (!Storage::disk('public')->exists($filePath)) {
                // Determine image color based on filename
                $colors = [
                    'course1.jpg' => '#3498db',  // Blue
                    'course2.jpg' => '#2ecc71',  // Green
                    'course3.jpg' => '#e74c3c',  // Red
                    'course4.jpg' => '#f39c12',  // Orange
                    'doc.png' => '#9b59b6',      // Purple
                    'pdf.png' => '#1abc9c',      // Turquoise
                    'ppt.png' => '#d35400',      // Pumpkin
                    'txt.png' => '#c0392b',      // Pomegranate
                    'xls.png' => '#16a085',      // Green Sea
                    'zip.png' => '#2980b9',      // Belize Hole
                    'post1.jpg' => '#8e44ad',    // Wisteria
                    'post2.jpg' => '#27ae60',    // Nephritis
                    'post3.jpg' => '#f1c40f',    // Sunflower
                    'post4.jpg' => '#e67e22'     // Carrot
                ];
                
                $color = $colors[$filename] ?? '#3498db';
                $label = pathinfo($filename, PATHINFO_FILENAME);
                
                $this->generateDummyImage(
                    storage_path("app/public/{$filePath}"),
                    $color,
                    ucwords(str_replace(['-', '.jpg', '.png'], [' ', '', ''], $label))
                );
            }
        }
    }
    
    /**
     * Generate a simple colored image with text
     */
    private function generateDummyImage($path, $bgColor, $text)
    {
        try {
            // Create a 400x300 image
            $width = 400;
            $height = 300;
            $image = imagecreatetruecolor($width, $height);
            
            // Background color
            $rgb = $this->hex2rgb($bgColor);
            $backgroundColor = imagecolorallocate($image, $rgb[0], $rgb[1], $rgb[2]);
            
            // Text color (white)
            $textColor = imagecolorallocate($image, 255, 255, 255);
            
            // Fill the background
            imagefilledrectangle($image, 0, 0, $width-1, $height-1, $backgroundColor);
            
            // Add centered text
            $fontSize = 4;
            $textWidth = imagefontwidth($fontSize) * strlen($text);
            $textHeight = imagefontheight($fontSize);
            $centerX = ($width - $textWidth) / 2;
            $centerY = ($height - $textHeight) / 2;
            
            imagestring($image, $fontSize, $centerX, $centerY, $text, $textColor);
            
            // Add UNISHARE text at the bottom
            $brandText = "UNISHARE";
            $brandTextWidth = imagefontwidth($fontSize) * strlen($brandText);
            $brandX = ($width - $brandTextWidth) / 2;
            imagestring($image, $fontSize, $brandX, $height - 30, $brandText, $textColor);
            
            // Make sure the directory exists
            $directory = dirname($path);
            if (!file_exists($directory)) {
                mkdir($directory, 0775, true);
            }
            
            // Save the image - use PNG for transparency if needed
            if (pathinfo($path, PATHINFO_EXTENSION) === 'png') {
                imagepng($image, $path);
            } else {
                imagejpeg($image, $path, 90);
            }
            
            imagedestroy($image);
            
        } catch (\Exception $e) {
            Log::error('Error generating dummy image: ' . $e->getMessage());
        }
    }
    
    /**
     * Convert hex color to RGB values
     */
    private function hex2rgb($hex) {
        $hex = str_replace("#", "", $hex);
        
        if(strlen($hex) == 3) {
            $r = hexdec(substr($hex, 0, 1).substr($hex, 0, 1));
            $g = hexdec(substr($hex, 1, 1).substr($hex, 1, 1));
            $b = hexdec(substr($hex, 2, 1).substr($hex, 2, 1));
        } else {
            $r = hexdec(substr($hex, 0, 2));
            $g = hexdec(substr($hex, 2, 2));
            $b = hexdec(substr($hex, 4, 2));
        }
        
        return array($r, $g, $b);
    }
}
