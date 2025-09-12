import * as fs from 'fs';
import * as path from 'path';

/**
 * Generic function to validate file existence and content
 */
export function validateFile(
  filePath: string,
  fileName: string,
  requiredFields?: string[],
  parseJson: boolean = false
): any {
  const fullPath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ ${fileName} not found:`);
    console.error(`   • ${fullPath}`);
    console.error('');
    console.error(`Please ensure the ${fileName} file exists.`);
    console.error('');
    
    process.exit(1);
  }
  
  console.log(`✅ ${fileName} found`);
  
  if (parseJson) {
    try {
      const fileContent = fs.readFileSync(fullPath, 'utf8');
      const parsedContent = JSON.parse(fileContent);
      
      if (requiredFields && requiredFields.length > 0) {
        const missingFields = requiredFields.filter(field => !parsedContent[field]);
        
        if (missingFields.length > 0) {
          console.error(`❌ Missing required fields in ${fileName}:`);
          console.error(`   • ${missingFields.join(', ')}`);
          console.error('');
          process.exit(1);
        }
      }
      
      return parsedContent;
    } catch (error) {
      console.error(`❌ Failed to parse ${fileName}:`, error);
      process.exit(1);
    }
  }
  
  return true;
}
