<?php

namespace App\Http\Requests\Settings;

use App\Concerns\ProfileValidationRules;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class ProfileUpdateRequest extends FormRequest
{
    use ProfileValidationRules;

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            ...$this->profileRules($this->user()->id),

            'phone' => [
                'nullable',
                'string',
                'max:30',
            ],

            'country_code' => [
                'nullable',
                'string',
                'size:2',
                'regex:/^[A-Za-z]{2}$/',
            ],

            'city' => [
                'nullable',
                'string',
                'max:150',
            ],

            'profile_photo' => [
                'nullable',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:2048',
            ],

            'remove_profile_photo' => [
                'nullable',
                'boolean',
            ],

            'short_bio' => [
                'nullable',
                'string',
                'max:1000',
            ],

            'is_public' => [
                'nullable',
                'boolean',
            ],
        ];
    }
}
