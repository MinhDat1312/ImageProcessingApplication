import { useState } from 'react';
import { Layout, Form, Input, Select, Slider, Button, Upload, Card, message, Spin, Typography, Space, Row, Col, Divider, Image as AntImage } from 'antd';
import { UploadOutlined, PictureOutlined, DownloadOutlined } from '@ant-design/icons';
import axios from 'axios';
import './App.css';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

function App() {
  const [form] = Form.useForm();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [executionTime, setExecutionTime] = useState<number | null>(null);

  const filterOptions = [
    { label: 'None', value: 'none' },
    { label: 'Grayscale', value: 'grayscale' },
    { label: 'Sepia', value: 'sepia' },
    { label: 'Brightness', value: 'brightness' },
  ];

  const watermarkPositions = [
    { label: 'Bottom Right', value: 'bottom-right' },
    { label: 'Bottom Left', value: 'bottom-left' },
    { label: 'Top Right', value: 'top-right' },
    { label: 'Top Left', value: 'top-left' },
    { label: 'Center', value: 'center' },
  ];

  const handleUploadChange = (info: any) => {
    if (info.fileList.length > 0) {
      const selectedFile = info.fileList[0].originFileObj;
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setProcessedUrl(null);
    } else {
      setFile(null);
      setPreviewUrl(null);
    }
  };

  const onFinish = async (values: any) => {
    if (!file) {
      message.error("Please upload an image first.");
      return;
    }

    setProcessing(true);
    const formData = new FormData();
    formData.append('file', file);
    
    if (values.resizeWidth) formData.append('resizeWidth', values.resizeWidth);
    if (values.resizeHeight) formData.append('resizeHeight', values.resizeHeight);
    
    if (values.filterType && values.filterType !== 'none') {
      formData.append('filterType', values.filterType);
      if (values.brightnessLevel) formData.append('brightnessLevel', values.brightnessLevel.toString());
    }
    
    if (values.watermarkText) {
      formData.append('watermarkText', values.watermarkText);
      formData.append('watermarkPosition', values.watermarkPosition || 'bottom-right');
      if (values.watermarkSize) formData.append('watermarkSize', values.watermarkSize);
    }
    
    if (values.compressionQuality) formData.append('compressionQuality', values.compressionQuality.toString());

    try {
      const response = await axios.post('http://localhost:8080/api/images/process', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setProcessedUrl(response.data.url);
      setExecutionTime(response.data.executionTimeMs);
      message.success("Image processed successfully!");
    } catch (error) {
      message.error("Failed to process image.");
      console.error(error);
    } finally {
      setProcessing(false);
    }
  };

  const downloadImage = () => {
    if (processedUrl) {
      window.open(processedUrl, '_blank');
    }
  };

  const selectedFilter = Form.useWatch('filterType', form);

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Header style={{ background: '#fff', padding: '0 20px', display: 'flex', alignItems: 'center', boxShadow: '0 2px 8px #f0f1f2' }}>
        <PictureOutlined style={{ fontSize: '24px', color: '#1890ff', marginRight: '16px' }} />
        <Title level={3} style={{ margin: 0 }}>Image Processing Pipeline</Title>
      </Header>
      
      <Content style={{ padding: '40px 50px' }}>
        <Row gutter={32}>
          <Col span={8}>
            <Card title="Pipeline Controls" bordered={false} style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: '8px' }}>
              <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                initialValues={{ filterType: 'none', watermarkPosition: 'bottom-right', watermarkSize: 30, compressionQuality: 1.0 }}
              >
                <Form.Item label="1. Input Stage: Upload Image" required>
                  <Upload beforeUpload={() => false} onChange={handleUploadChange} maxCount={1} accept="image/png, image/jpeg">
                    <Button icon={<UploadOutlined />}>Select Image</Button>
                  </Upload>
                </Form.Item>

                <Divider style={{ margin: '12px 0' }}>2. Resize Stage</Divider>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name="resizeWidth" label="Width (px)">
                      <Input type="number" placeholder="Original" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="resizeHeight" label="Height (px)">
                      <Input type="number" placeholder="Original" />
                    </Form.Item>
                  </Col>
                </Row>

                <Divider style={{ margin: '12px 0' }}>3. Filter Stage</Divider>
                <Form.Item name="filterType" label="Filter Selection">
                  <Select options={filterOptions} />
                </Form.Item>
                {selectedFilter === 'brightness' && (
                  <Form.Item name="brightnessLevel" label="Brightness Level (1.0 = Default)">
                    <Slider min={0.1} max={3.0} step={0.1} />
                  </Form.Item>
                )}

                <Divider style={{ margin: '12px 0' }}>4. Watermark Stage</Divider>
                <Form.Item name="watermarkText" label="Watermark Text">
                  <Input placeholder="Enter text to overlap" />
                </Form.Item>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name="watermarkPosition" label="Position">
                      <Select options={watermarkPositions} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="watermarkSize" label="Size">
                      <Input type="number" />
                    </Form.Item>
                  </Col>
                </Row>

                <Divider style={{ margin: '12px 0' }}>5. Compression Stage</Divider>
                <Form.Item name="compressionQuality" label="JPEG Quality (1.0 = Best)">
                  <Slider min={0.1} max={1.0} step={0.1} />
                </Form.Item>

                <Button type="primary" htmlType="submit" size="large" block loading={processing} style={{ marginTop: 24, padding: '0 40px', borderRadius: '4px' }}>
                  Execute Pipeline
                </Button>
              </Form>
            </Card>
          </Col>

          <Col span={16}>
            <Card title="Image Preview Preview" bordered={false} style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: '8px', minHeight: '600px' }}>
              {processing && (
                <div style={{ textAlign: 'center', margin: '40px 0' }}>
                  <Spin size="large" />
                  <p style={{ marginTop: 16, color: '#888' }}>Processing pipeline...</p>
                </div>
              )}
              
              {!processing && !previewUrl && (
                <div style={{ padding: '100px 0', textAlign: 'center', color: '#bfbfbf' }}>
                  <PictureOutlined style={{ fontSize: '48px' }} />
                  <p style={{ marginTop: '16px' }}>Upload an image to see preview</p>
                </div>
              )}

              {previewUrl && !processing && (
                <Row gutter={24}>
                  <Col span={12}>
                    <div style={{ textAlign: 'center' }}>
                      <Text strong style={{ display: 'block', marginBottom: 12 }}>Original Input</Text>
                      <div style={{ border: '1px dashed #d9d9d9', padding: '8px', borderRadius: '4px', backgroundColor: '#fafafa' }}>
                        <AntImage src={previewUrl} style={{ width: '100%', objectFit: 'contain' }} />
                      </div>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div style={{ textAlign: 'center' }}>
                      <Text strong style={{ display: 'block', marginBottom: 12 }}>Pipeline Output</Text>
                      {processedUrl ? (
                         <div style={{ border: '1px solid #91d5ff', padding: '8px', borderRadius: '4px', backgroundColor: '#e6f7ff' }}>
                          <AntImage src={processedUrl} style={{ width: '100%', objectFit: 'contain' }} />
                        </div>
                      ) : (
                        <div style={{ border: '1px dashed #d9d9d9', padding: '60px 0', borderRadius: '4px', backgroundColor: '#fafafa', color: '#bfbfbf' }}>
                           Pending Processing...
                        </div>
                      )}
                    </div>
                  </Col>
                </Row>
              )}
              
              {processedUrl && !processing && (
                <div style={{ marginTop: 40, textAlign: 'center' }}>
                  <Space size="large">
                    {executionTime !== null && (
                      <Text type="success">Pipeline execution time: {executionTime} ms</Text>
                    )}
                    <Button type="primary" icon={<DownloadOutlined />} onClick={downloadImage}>
                      Download Processed Image
                    </Button>
                  </Space>
                </div>
              )}
            </Card>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
}

export default App;
