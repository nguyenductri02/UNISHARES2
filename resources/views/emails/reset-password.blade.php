<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Đặt Lại Mật Khẩu</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            color: #333;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            border: 1px solid #ddd;
            border-radius: 5px;
            background-color: #f9f9f9;
            padding: 20px;
        }
        .header {
            background-color: #0070C0;
            color: white;
            padding: 10px;
            text-align: center;
            border-radius: 5px 5px 0 0;
        }
        .content {
            background-color: white;
            padding: 20px;
            border-radius: 0 0 5px 5px;
        }
        .button {
            display: inline-block;
            background-color: #0070C0;
            color: white;
            text-decoration: none;
            padding: 10px 20px;
            border-radius: 5px;
            margin: 20px 0;
        }
        .footer {
            margin-top: 20px;
            text-align: center;
            font-size: 12px;
            color: #777;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>UNISHARE - Đặt Lại Mật Khẩu</h2>
        </div>
        <div class="content">
            <p>Xin chào {{ $username }},</p>
            
            <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản UNISHARE của bạn. Vui lòng nhấp vào nút bên dưới để đặt lại mật khẩu:</p>
            
            <p style="text-align: center;">
                <a href="{{ $resetUrl }}" class="button">Đặt Lại Mật Khẩu</a>
            </p>
            
            <p>Hoặc sao chép và dán đường dẫn sau vào trình duyệt của bạn:</p>
            <p>{{ $resetUrl }}</p>
            
            <p>Liên kết này sẽ hết hạn sau 60 phút.</p>
            
            <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này hoặc liên hệ với chúng tôi để báo cáo.</p>
            
            <p>Trân trọng,<br>Đội ngũ UNISHARE</p>
        </div>
        <div class="footer">
            <p>© {{ date('Y') }} UNISHARE. Tất cả các quyền được bảo lưu.</p>
        </div>
    </div>
</body>
</html>
