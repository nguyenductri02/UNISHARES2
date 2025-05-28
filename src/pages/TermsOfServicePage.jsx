import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import Header from '../components/Header';
import Footer from '../components/Footer';
import UnshareSidebar from '../components/unishare/UnishareSidebar';

const TermsOfServicePage = () => {
  return (
    <>
      <Header />
      <div className="py-4" style={{ backgroundColor: '#e9f5ff', minHeight: 'calc(100vh - 120px)' }}>
        <Container>
          <Row>
            {/* Sidebar */}
            <Col md={3}>
              <UnshareSidebar activeSection="terms" />
            </Col>
            
            {/* Main Content */}
            <Col md={9}>
              <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: '1rem' }}>
                <Card.Body className="p-4">
                  <h2 className="text-primary fw-bold mb-4">Điều Khoản Người Dùng UniShare</h2>
                  
                  <div className="terms-section mb-4">
                    <h5 className="fw-bold" style={{ color: '#0370b7' }}>1. Giới thiệu</h5>
                    <p>
                      Chào mừng bạn đến với UniShare - nền tảng chia sẻ tài liệu học tập. Các điều khoản này 
                      ("Điều khoản") chi phối việc sử dụng và truy cập vào trang web, ứng dụng di động và
                      các dịch vụ trực tuyến khác của UniShare (gọi chung là "Dịch vụ").
                    </p>
                    <p>
                      Bằng cách truy cập hoặc sử dụng Dịch vụ của chúng tôi, bạn đồng ý bị ràng buộc bởi
                      những Điều khoản này. Nếu bạn không đồng ý với bất kỳ phần nào của các Điều khoản,
                      bạn không thể truy cập hoặc sử dụng Dịch vụ của chúng tôi.
                    </p>
                  </div>
                  
                  <div className="terms-section mb-4">
                    <h5 className="fw-bold" style={{ color: '#0370b7' }}>2. Tài khoản người dùng</h5>
                    <p>
                      Khi bạn tạo tài khoản với chúng tôi, bạn phải cung cấp thông tin chính xác, đầy đủ và
                      cập nhật mọi lúc. Thông tin không chính xác, không đầy đủ hoặc lỗi thời có thể dẫn đến
                      việc chấm dứt tài khoản của bạn trên Dịch vụ của chúng tôi.
                    </p>
                    <p>
                      Bạn chịu trách nhiệm bảo mật mật khẩu tài khoản của mình và cho tất cả các hoạt động
                      xảy ra dưới tài khoản của bạn. Bạn đồng ý thông báo cho chúng tôi ngay lập tức về bất kỳ
                      việc sử dụng trái phép tài khoản của bạn hoặc bất kỳ vi phạm bảo mật nào khác.
                    </p>
                    <p>
                      Chúng tôi có quyền xóa, thu hồi hoặc thay đổi tên người dùng nếu chúng tôi xác định rằng
                      tên người dùng đó không phù hợp, xúc phạm hoặc vi phạm thương hiệu của bên thứ ba.
                    </p>
                  </div>
                  
                  <div className="terms-section mb-4">
                    <h5 className="fw-bold" style={{ color: '#0370b7' }}>3. Nội dung người dùng</h5>
                    <p>
                      Dịch vụ của chúng tôi cho phép bạn đăng, liên kết, lưu trữ, chia sẻ và cung cấp thông tin, 
                      văn bản, đồ họa, video hoặc tài liệu khác ("Nội dung"). Bạn chịu trách nhiệm về Nội dung bạn đăng 
                      trên hoặc thông qua Dịch vụ, bao gồm tính hợp pháp, độ tin cậy và tính phù hợp của nó.
                    </p>
                    <p>
                      Bằng cách đăng Nội dung trên hoặc thông qua Dịch vụ, bạn tuyên bố và đảm bảo rằng:
                    </p>
                    <ul>
                      <li>
                        Nội dung thuộc sở hữu của bạn hoặc bạn có quyền sử dụng nó và cấp cho chúng tôi các quyền 
                        được mô tả trong các Điều khoản này.
                      </li>
                      <li>
                        Nội dung không vi phạm và sẽ không vi phạm quyền của bất kỳ bên thứ ba nào, bao gồm bản quyền, 
                        thương hiệu, quyền riêng tư, công khai, sở hữu trí tuệ hoặc các quyền cá nhân hoặc tài sản khác.
                      </li>
                      <li>
                        Việc sử dụng và đăng Nội dung của bạn không vi phạm Điều khoản hoặc bất kỳ luật hoặc quy định hiện hành nào.
                      </li>
                    </ul>
                  </div>
                  
                  <div className="terms-section mb-4">
                    <h5 className="fw-bold" style={{ color: '#0370b7' }}>4. Quyền sở hữu trí tuệ</h5>
                    <p>
                      UniShare và các nhà cấp phép của nó sở hữu và giữ lại tất cả các quyền đối với Dịch vụ UniShare.
                      Tất cả các quyền không được cấp rõ ràng đều được bảo lưu. Dịch vụ UniShare được bảo vệ bởi bản quyền, 
                      thương hiệu và các luật khác của Việt Nam và các quốc gia khác.
                    </p>
                    <p>
                      Bạn không được phép: (a) sao chép, sửa đổi phần mềm, các văn bản, đồ họa, logo, thiết kế, âm thanh, 
                      hình ảnh, và các mục khác của Dịch vụ; (b) thực hiện kỹ thuật đảo ngược hoặc cố gắng trích xuất mã nguồn;
                      (c) xóa bất kỳ thông báo bản quyền hoặc sở hữu nào; hoặc (d) cố gắng vô hiệu hóa, phá hoại, gây hại, 
                      hoặc can thiệp vào hoạt động bình thường của Dịch vụ.
                    </p>
                  </div>
                  
                  <div className="terms-section mb-4">
                    <h5 className="fw-bold" style={{ color: '#0370b7' }}>5. Chấm dứt</h5>
                    <p>
                      Chúng tôi có thể chấm dứt hoặc đình chỉ quyền truy cập của bạn vào tất cả hoặc một phần của Dịch vụ ngay lập tức,
                      mà không cần thông báo trước, vì bất kỳ lý do gì hoặc không có lý do, bao gồm nhưng không giới hạn ở 
                      việc vi phạm các Điều khoản.
                    </p>
                    <p>
                      Nếu bạn muốn chấm dứt tài khoản của mình, bạn có thể đơn giản ngừng sử dụng Dịch vụ của chúng tôi. Tuy nhiên,
                      tất cả các điều khoản của Thỏa thuận này vẫn có hiệu lực sau khi chấm dứt, bao gồm nhưng không giới hạn ở 
                      quyền sở hữu, miễn trừ bảo hành, bồi thường và giới hạn trách nhiệm.
                    </p>
                  </div>
                  
                  <div className="terms-section mb-4">
                    <h5 className="fw-bold" style={{ color: '#0370b7' }}>6. Miễn trừ và giới hạn trách nhiệm</h5>
                    <p>
                      Dịch vụ của chúng tôi được cung cấp "nguyên trạng" và "như khả dụng" mà không có bất kỳ sự đảm bảo nào,
                      dù rõ ràng hay ngụ ý. Chúng tôi từ chối mọi bảo đảm về tính chính xác, khả năng thương mại, tính phù hợp
                      cho một mục đích cụ thể và không vi phạm.
                    </p>
                    <p>
                      Trong mọi trường hợp, UniShare, các giám đốc, nhân viên, đối tác, đại lý, nhà cung cấp hoặc nhà liên kết của nó
                      sẽ không chịu trách nhiệm về bất kỳ thiệt hại gián tiếp, ngẫu nhiên, đặc biệt, do hậu quả hoặc trừng phạt nào,
                      bao gồm việc mất lợi nhuận, dữ liệu, việc sử dụng, uy tín, hoặc các tổn thất vô hình khác, do sử dụng hoặc không
                      thể sử dụng Dịch vụ.
                    </p>
                  </div>
                  
                  <div className="terms-section mb-4">
                    <h5 className="fw-bold" style={{ color: '#0370b7' }}>7. Thay đổi điều khoản</h5>
                    <p>
                      Chúng tôi có quyền, theo quyết định riêng của mình, sửa đổi hoặc thay thế các Điều khoản này bất cứ lúc nào.
                      Nếu việc sửa đổi quan trọng, chúng tôi sẽ cố gắng thông báo trước ít nhất 30 ngày trước khi các điều khoản mới
                      có hiệu lực. Việc bạn tiếp tục truy cập hoặc sử dụng Dịch vụ của chúng tôi sau khi thông báo về những thay đổi
                      đồng nghĩa với việc bạn đồng ý bị ràng buộc bởi các điều khoản đã sửa đổi.
                    </p>
                  </div>
                  
                  <div className="terms-section mb-4">
                    <h5 className="fw-bold" style={{ color: '#0370b7' }}>8. Liên hệ</h5>
                    <p>
                      Nếu bạn có bất kỳ câu hỏi nào về các Điều khoản này, vui lòng liên hệ với chúng tôi tại:<br />
                      <strong>Email:</strong> support@unishare.edu.vn<br />
                      <strong>Địa chỉ:</strong> UniShare Education, Da Nang, Vietnam
                    </p>
                  </div>
                  
                  <div className="terms-footer text-center mt-5 pt-3 border-top">
                    <p className="text-muted">
                      Cập nhật lần cuối: Ngày 23 tháng 05 năm 2025
                    </p>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
      <Footer />
    </>
  );
};

export default TermsOfServicePage;
