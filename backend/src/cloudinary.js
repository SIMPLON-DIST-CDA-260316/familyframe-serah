import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

export { cloudinary }

export function uploadImage(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'familyframe', resource_type: 'image', type: 'authenticated', timeout: 20000 },
      (error, result) => {
        if (error) reject(error)
        else resolve(result)
      },
    )
    stream.on('error', reject)
    stream.end(buffer)
  })
}
