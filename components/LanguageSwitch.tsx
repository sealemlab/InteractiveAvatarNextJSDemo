import { Select, Space } from 'antd';
import { GlobalOutlined } from '@ant-design/icons';

import { useI18n } from '@/app/lib/i18n';

export default function LanguageSwitch() {
  const { language, setLanguage } = useI18n();

  return (
    <Select
      defaultValue={language}
      style={{ width: 90 }}
      onChange={setLanguage}
      options={[
        {
          value: 'zh',
          label: <Space>中文</Space>
        },
        {
          value: 'en',
          label: <Space>English</Space>
        }
      ]}
    />
  );
}
